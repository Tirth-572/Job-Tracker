import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { User, Briefcase, Calendar, MessageSquare, MoreVertical, Settings } from 'lucide-react';
import { applicationAPI, workflowAPI } from '../../services/api';
import { Badge, Avatar, Modal, Button, Input, Textarea, SkeletonCard } from '../../components/ui';
import { formatRelativeDate, cn, getFileUrl } from '../../lib/utils';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const ApplicationCard = ({ app, index, onAction, stages }) => {
 const [menuOpen, setMenuOpen] = useState(false);
 const stage = stages.find(s => s.id === app.stageId);
 return (
 <Draggable draggableId={app.id} index={index}>
 {(provided, snapshot) => (
 <div
 ref={provided.innerRef}
 {...provided.draggableProps}
 {...provided.dragHandleProps}
 onClick={() => onAction('view', app)}
 className={cn(
 'bg-brand-surface rounded-xl p-4 shadow-sm border border-brand-primary/20 cursor-grab active:cursor-grabbing transition-all hover:ring-2 hover:ring-brand-primary/40',
 snapshot.isDragging && 'shadow-lg rotate-2 ring-2 ring-brand-primary bg-white z-50'
 )}
 >
 <div className="flex items-start gap-3 mb-3">
 <Avatar
 name={`${app.candidate?.firstName} ${app.candidate?.lastName}`}
 src={getFileUrl(app.candidate?.avatar)}
 size="sm"
 />
 <div className="flex-1 min-w-0">
 <p className="text-sm font-bold text-gray-900 truncate">
 {app.candidate?.firstName} {app.candidate?.lastName}
 </p>
 <p className="text-xs font-medium text-gray-500 truncate mt-0.5">{app.job?.title}</p>
 </div>
 <div className="relative">
 <button onClick={(e) => { e.stopPropagation(); setMenuOpen(p => !p); }} className="p-1 hover:bg-white rounded-lg transition-colors">
 <MoreVertical size={16} className="text-gray-400" />
 </button>
 {menuOpen && (
 <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-brand-primary/10 z-10 py-1 overflow-hidden">
 <button onClick={(e) => { e.stopPropagation(); onAction('view', app); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-brand-bg text-gray-700 flex items-center gap-2 transition-colors"><User size={15} /> View Profile</button>
 {stage?.isInterview && (
 <button onClick={(e) => { e.stopPropagation(); onAction('interview', app, stage); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-brand-bg text-gray-700 flex items-center gap-2 transition-colors"><Calendar size={15} /> Schedule Interview</button>
 )}
 <button onClick={(e) => { e.stopPropagation(); onAction('reject', app); setMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">Reject</button>
 </div>
 )}
 </div>
 </div>
 <p className="text-xs font-medium text-gray-400">{formatRelativeDate(app.appliedAt)}</p>
 {app.interviews?.length > 0 && (
 <div className="mt-3 p-2.5 bg-white/60 rounded-xl border border-brand-primary/10">
 <div className="flex items-center gap-1.5 text-xs font-bold text-brand-primary mb-1">
 <Calendar size={13} />
 {app.interviews[0].customTypeName || app.interviews[0].stage?.name || 'Interview Scheduled'}
 </div>
 <p className="text-[11px] font-medium text-gray-500">
 {new Date(app.interviews[0].scheduledAt).toLocaleString()}
 </p>
 </div>
 )}
 </div>
 )}
 </Draggable>
 );
};

export default function Pipeline() {
 const [stages, setStages] = useState([]);
 const [board, setBoard] = useState({});
 const [loading, setLoading] = useState(true);
 
 const [actionModal, setActionModal] = useState(null);
 const [selectedApp, setSelectedApp] = useState(null);
 const [selectedStage, setSelectedStage] = useState(null);
 
 const [interviewForm, setInterviewForm] = useState({ duration: 60 });
 const [statusForm, setStatusForm] = useState({ notes: '', rejectionReason: '' });
 const [saving, setSaving] = useState(false);

 const fetchData = async () => {
 try {
 const [{ data: fetchedStages }, { data: appData }] = await Promise.all([
 workflowAPI.getWorkflows(),
 applicationAPI.getCompanyApplications({ limit: 500 })
 ]);

 setStages(fetchedStages);
 
 const grouped = {};
 fetchedStages.forEach(stg => { grouped[stg.id] = []; });
 
 appData.applications.forEach(app => {
 if (grouped[app.stageId]) grouped[app.stageId].push(app);
 });
 
 setBoard(grouped);
 } catch (err) {
 toast.error('Failed to load pipeline data');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => { fetchData(); }, []);

 const onDragEnd = async (result) => {
 const { source, destination, draggableId } = result;
 if (!destination || source.droppableId === destination.droppableId) return;

 const newStageId = destination.droppableId;
 const app = board[source.droppableId].find(a => a.id === draggableId);
 if (!app) return;

 const targetStage = stages.find(s => s.id === newStageId);

 // Optimistic update
 setBoard(prev => {
 const next = { ...prev };
 next[source.droppableId] = next[source.droppableId].filter(a => a.id !== draggableId);
 next[destination.droppableId] = [{ ...app, stageId: newStageId }, ...next[destination.droppableId]];
 return next;
 });

 try {
 await applicationAPI.updateStatus(draggableId, { stageId: newStageId });
 toast.success(`Moved to ${targetStage.name}`);
 
 if (targetStage.isInterview) {
 handleAction('interview', { ...app, stageId: newStageId }, targetStage);
 }
 } catch (err) {
 toast.error('Failed to update stage');
 fetchData(); // revert
 }
 };

 const handleAction = (type, app, stage = null) => {
 setSelectedApp(app);
 setSelectedStage(stage);
 setActionModal(type);
 setStatusForm({ notes: app.notes || '', rejectionReason: app.rejectionReason || '' });
 setInterviewForm({ duration: 60, customTypeName: stage?.name || 'Interview', type: stage?.interviewType || 'HR' });
 };

 const handleInterview = async () => {
 setSaving(true);
 try {
 await applicationAPI.scheduleInterview(selectedApp.id, { ...interviewForm, stageId: selectedStage?.id });
 toast.success('Interview scheduled!');
 setActionModal(null);
 fetchData();
 } catch { toast.error('Failed to schedule'); }
 finally { setSaving(false); }
 };

 const handleReject = async () => {
 setSaving(true);
 try {
 const rejectStage = stages.find(s => s.systemType === 'REJECTED');
 await applicationAPI.updateStatus(selectedApp.id, { 
 stageId: rejectStage?.id,
 status: 'REJECTED', 
 ...statusForm 
 });
 toast.success('Application rejected');
 setActionModal(null);
 fetchData();
 } catch { toast.error('Failed'); }
 finally { setSaving(false); }
 };

 if (loading) return (
 <div className="flex gap-4 overflow-x-auto pb-4">
 {[1, 2, 3, 4, 5].map(i => (
 <div key={i} className="min-w-64 bg-brand-surface rounded-2xl p-4 animate-pulse">
 <div className="h-5 bg-brand-primary/20 rounded-lg mb-4 w-2/3" />
 {[...Array(2)].map((_, j) => <div key={j} className="h-24 bg-white/50 rounded-xl mb-3" />)}
 </div>
 ))}
 </div>
 );

 return (
 <div className="space-y-6 h-full flex flex-col">
 <div className="flex items-center justify-between">
 <div className="page-header mb-0">
 <h1 className="page-title">Hiring Pipeline</h1>
 <p className="page-subtitle">Drag & drop candidates between custom stages</p>
 </div>
 <Link to="/company/workflows">
 <Button variant="secondary" className="flex items-center gap-2 font-bold text-sm bg-brand-surface text-brand-primary hover:bg-white shadow-soft transition-all">
 <Settings size={16} /> Edit Pipeline Stages
 </Button>
 </Link>
 </div>

 <DragDropContext onDragEnd={onDragEnd}>
 <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 lg:mx-0 lg:px-0 flex-1 scrollbar-hide">
 {stages.map(stage => {
 const cards = board[stage.id] || [];
 return (
 <div key={stage.id} className="w-72 flex-shrink-0 bg-white/40 backdrop-blur-sm rounded-2xl border-t-4 border-brand-primary/30 shadow-soft flex flex-col" style={{ borderTopColor: stage.color?.match(/text-([a-z]+)-(\d+)/)?.[0] ? 'var(--brand-primary)' : 'var(--brand-primary)' }}>
 <div className="p-4 border-b border-brand-primary/10">
 <div className="flex items-center justify-between mb-1">
 <h3 className={cn("text-xs font-bold uppercase tracking-wider", stage.color || "text-gray-800")}>{stage.name}</h3>
 <span className="bg-brand-surface text-brand-primary text-xs font-bold rounded-full px-2.5 py-0.5 shadow-sm border border-brand-primary/20">{cards.length}</span>
 </div>
 {stage.isInterview && <p className="text-[11px] font-semibold text-brand-primary mt-1">Requires Interview</p>}
 </div>
 <Droppable droppableId={stage.id}>
 {(provided, snapshot) => (
 <div
 ref={provided.innerRef}
 {...provided.droppableProps}
 className={cn('p-3 space-y-3 flex-1 min-h-[200px] transition-colors rounded-b-2xl', snapshot.isDraggingOver && 'bg-brand-primary/5')}
 >
 {cards.map((app, idx) => (
 <ApplicationCard key={app.id} app={app} index={idx} onAction={handleAction} stages={stages} />
 ))}
 {provided.placeholder}
 {cards.length === 0 && !snapshot.isDraggingOver && (
 <div className="flex items-center justify-center h-24 text-sm font-medium text-gray-400 border-2 border-dashed border-brand-primary/20 rounded-xl m-2">Drop here</div>
 )}
 </div>
 )}
 </Droppable>
 </div>
 );
 })}
 </div>
 </DragDropContext>

 {/* Interview Modal */}
 <Modal isOpen={actionModal === 'interview'} onClose={() => setActionModal(null)} title={`Schedule: ${selectedStage?.name || 'Interview'}`}>
 <div className="space-y-4">
 {selectedApp && (
 <div className="p-4 bg-brand-bg rounded-xl border border-brand-primary/20">
 <p className="font-bold text-gray-900">{selectedApp.candidate?.firstName} {selectedApp.candidate?.lastName}</p>
 <p className="text-sm font-medium text-gray-500 mt-1">{selectedApp.job?.title}</p>
 </div>
 )}
 {selectedStage?.instructions && (
 <div className="p-4 bg-brand-surface text-brand-primary rounded-xl text-sm border border-brand-primary/30 font-medium">
 <strong>Instructions:</strong> {selectedStage.instructions}
 </div>
 )}
 
 <Input label="Interview Name" value={interviewForm.customTypeName || ''} onChange={e => setInterviewForm(p => ({ ...p, customTypeName: e.target.value }))} required />
 <div className="space-y-1">
 <label className="block text-sm font-bold text-gray-700">Interview Type</label>
 <select 
 className="w-full bg-white border border-brand-primary/20 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-shadow" 
 value={interviewForm.type || 'HR'} 
 onChange={e => setInterviewForm(p => ({ ...p, type: e.target.value }))}
 >
 <option value="HR">HR Screening</option>
 <option value="TECHNICAL">Technical Interview</option>
 <option value="PRACTICAL">Practical Interview</option>
 <option value="QA_ROUND">Question & Answer Round</option>
 <option value="BEHAVIORAL">Behavioral Interview</option>
 <option value="FINAL">Final Interview</option>
 </select>
 </div>
 <Input label="Date & Time" type="datetime-local" value={interviewForm.scheduledAt || ''} onChange={e => setInterviewForm(p => ({ ...p, scheduledAt: e.target.value }))} />
 <Input label="Duration (minutes)" type="number" value={interviewForm.duration} onChange={e => setInterviewForm(p => ({ ...p, duration: parseInt(e.target.value) }))} />
 <Input label="Meeting Link" placeholder="https://meet.google.com/..." value={interviewForm.meetingLink || ''} onChange={e => setInterviewForm(p => ({ ...p, meetingLink: e.target.value }))} />
 <Input label="Location (for in-person)" value={interviewForm.location || ''} onChange={e => setInterviewForm(p => ({ ...p, location: e.target.value }))} />
 <Textarea label="Notes" rows={2} value={interviewForm.notes || ''} onChange={e => setInterviewForm(p => ({ ...p, notes: e.target.value }))} />
 <div className="flex gap-4 mt-6 pt-6 border-t border-brand-primary/10">
 <button onClick={handleInterview} disabled={saving} className="btn-primary flex-1">Schedule</button>
 <button onClick={() => setActionModal(null)} className="btn-ghost">Cancel</button>
 </div>
 </div>
 </Modal>

 {/* Reject Modal */}
 <Modal isOpen={actionModal === 'reject'} onClose={() => setActionModal(null)} title="Reject Application">
 <div className="space-y-4">
 <p className="text-sm font-medium text-gray-500">This will send a rejection notification to the candidate.</p>
 <Textarea label="Rejection Reason (optional)" rows={3} value={statusForm.rejectionReason} onChange={e => setStatusForm(p => ({ ...p, rejectionReason: e.target.value }))} placeholder="Provide a reason to help the candidate improve..." />
 <div className="flex gap-4 mt-6 pt-6 border-t border-brand-primary/10">
 <button onClick={handleReject} disabled={saving} className="btn-danger flex-1">Reject Application</button>
 <button onClick={() => setActionModal(null)} className="btn-ghost">Cancel</button>
 </div>
 </div>
 </Modal>
 {/* View Modal */}
 <Modal isOpen={actionModal === 'view'} onClose={() => setActionModal(null)} title="Application Details" size="lg">
 {selectedApp && (
 <div className="space-y-5">
 <div className="p-5 bg-brand-surface rounded-2xl border border-brand-primary/20 flex items-center gap-4">
 <Avatar name={`${selectedApp.candidate?.firstName} ${selectedApp.candidate?.lastName}`} src={getFileUrl(selectedApp.candidate?.avatar)} size="md" />
 <div>
 <h3 className="font-bold text-gray-900 text-lg">{selectedApp.candidate?.firstName} {selectedApp.candidate?.lastName}</h3>
 <p className="text-sm font-medium text-gray-500">{selectedApp.candidate?.user?.email || selectedApp.candidate?.location || 'Candidate'}</p>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="p-4 bg-brand-bg rounded-xl border border-brand-primary/10">
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Applied for</p>
 <p className="font-bold text-brand-primary">{selectedApp.job?.title}</p>
 </div>
 <div className="p-4 bg-brand-bg rounded-xl border border-brand-primary/10">
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Applied Date</p>
 <p className="font-bold text-gray-900">{new Date(selectedApp.appliedAt).toLocaleString()}</p>
 </div>
 </div>
 {(selectedApp.resumeUrl || selectedApp.candidate?.resumeUrl) && (
 <div>
 <p className="text-sm font-bold text-gray-900 mb-2">Resume</p>
 <iframe 
 src={getFileUrl(selectedApp.resumeUrl || selectedApp.candidate?.resumeUrl)} 
 className="w-full h-[400px] border border-brand-primary/20 rounded-2xl shadow-soft"
 title="Resume PDF"
 />
 <div className="mt-3 text-right">
 <a href={getFileUrl(selectedApp.resumeUrl || selectedApp.candidate?.resumeUrl)} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-brand-primary hover:text-brand-secondary transition-colors">
 Open in new tab
 </a>
 </div>
 </div>
 )}
 <div className="pt-6 border-t border-brand-primary/10 flex gap-4">
 <Link to="/company/applications" className="flex-1">
 <button className="btn-primary w-full">Manage Applications</button>
 </Link>
 <button onClick={() => setActionModal(null)} className="btn-ghost">Close</button>
 </div>
 </div>
 )}
 </Modal>
 </div>
 );
}
