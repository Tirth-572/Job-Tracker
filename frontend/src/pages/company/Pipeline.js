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
 className={cn(
 'bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing transition-shadow',
 snapshot.isDragging && 'shadow-lg rotate-1 ring-2 ring-primary-400'
 )}
 >
 <div className="flex items-start gap-2 mb-2">
 <Avatar
 name={`${app.candidate?.firstName} ${app.candidate?.lastName}`}
 src={getFileUrl(app.candidate?.avatar)}
 size="sm"
 />
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-gray-900 truncate">
 {app.candidate?.firstName} {app.candidate?.lastName}
 </p>
 <p className="text-xs text-gray-500 truncate">{app.job?.title}</p>
 </div>
 <div className="relative">
 <button onClick={() => setMenuOpen(p => !p)} className="p-1 hover:bg-gray-100 :bg-gray-700 rounded">
 <MoreVertical size={14} className="text-gray-400" />
 </button>
 {menuOpen && (
 <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-200 z-10 py-1">
 <button onClick={() => { onAction('view', app); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 :bg-gray-700 flex items-center gap-2"><User size={14} /> View Profile</button>
 {stage?.isInterview && (
 <button onClick={() => { onAction('interview', app, stage); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 :bg-gray-700 flex items-center gap-2"><Calendar size={14} /> Schedule Interview</button>
 )}
 <button onClick={() => { onAction('reject', app); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 :bg-red-900/20 flex items-center gap-2">Reject</button>
 </div>
 )}
 </div>
 </div>
 <p className="text-xs text-gray-400">{formatRelativeDate(app.appliedAt)}</p>
 {app.interviews?.length > 0 && (
 <div className="mt-2 p-2 bg-gray-50 rounded-lg">
 <div className="flex items-center gap-1 text-xs font-medium text-purple-600 mb-1">
 <Calendar size={11} />
 {app.interviews[0].customTypeName || app.interviews[0].stage?.name || 'Interview Scheduled'}
 </div>
 <p className="text-[10px] text-gray-500">
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
 <div key={i} className="min-w-56 bg-gray-100 rounded-xl p-3 animate-pulse">
 <div className="h-5 bg-gray-200 rounded mb-3" />
 {[...Array(2)].map((_, j) => <div key={j} className="h-20 bg-gray-200 rounded-xl mb-2" />)}
 </div>
 ))}
 </div>
 );

 return (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-gray-900 ">Hiring Pipeline</h1>
 <p className="text-gray-500 mt-1">Drag & drop candidates between custom stages</p>
 </div>
 <Link to="/company/workflows">
 <Button variant="secondary" className="flex items-center gap-2">
 <Settings size={18} /> Edit Pipeline Stages
 </Button>
 </Link>
 </div>

 <DragDropContext onDragEnd={onDragEnd}>
 <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
 {stages.map(stage => {
 const cards = board[stage.id] || [];
 return (
 <div key={stage.id} className="min-w-52 max-w-56 flex-shrink-0 bg-gray-50 rounded-xl border-t-4 shadow-sm" style={{ borderTopColor: stage.color?.match(/text-([a-z]+)-(\d+)/)?.[0] ? 'currentColor' : '#cbd5e1' }}>
 <div className="p-3 border-b border-gray-200 ">
 <div className="flex items-center justify-between mb-1">
 <h3 className={cn("text-xs font-semibold uppercase tracking-wide", stage.color || "text-gray-700 ")}>{stage.name}</h3>
 <span className="bg-white text-gray-600 text-xs font-medium rounded-full px-2 py-0.5 shadow-sm border border-gray-100 ">{cards.length}</span>
 </div>
 {stage.isInterview && <p className="text-[10px] text-purple-500">Requires Interview</p>}
 </div>
 <Droppable droppableId={stage.id}>
 {(provided, snapshot) => (
 <div
 ref={provided.innerRef}
 {...provided.droppableProps}
 className={cn('p-2 space-y-2 min-h-32 transition-colors', snapshot.isDraggingOver && 'bg-primary-50/50 ')}
 >
 {cards.map((app, idx) => (
 <ApplicationCard key={app.id} app={app} index={idx} onAction={handleAction} stages={stages} />
 ))}
 {provided.placeholder}
 {cards.length === 0 && !snapshot.isDraggingOver && (
 <div className="text-center py-6 text-xs text-gray-400">Drop here</div>
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
 <div className="space-y-3">
 {selectedApp && (
 <div className="p-3 bg-gray-50 rounded-lg">
 <p className="font-medium">{selectedApp.candidate?.firstName} {selectedApp.candidate?.lastName}</p>
 <p className="text-sm text-gray-500">{selectedApp.job?.title}</p>
 </div>
 )}
 {selectedStage?.instructions && (
 <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100 ">
 <strong>Instructions:</strong> {selectedStage.instructions}
 </div>
 )}
 
 <Input label="Interview Name" value={interviewForm.customTypeName || ''} onChange={e => setInterviewForm(p => ({ ...p, customTypeName: e.target.value }))} required />
 <div className="space-y-1">
 <label className="block text-sm font-medium text-gray-700 ">Interview Type</label>
 <select 
 className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" 
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
 <div className="flex gap-3">
 <Button onClick={handleInterview} loading={saving} className="flex-1">Schedule</Button>
 <Button variant="secondary" onClick={() => setActionModal(null)}>Cancel</Button>
 </div>
 </div>
 </Modal>

 {/* Reject Modal */}
 <Modal isOpen={actionModal === 'reject'} onClose={() => setActionModal(null)} title="Reject Application">
 <div className="space-y-3">
 <p className="text-sm text-gray-500">This will send a rejection notification to the candidate.</p>
 <Textarea label="Rejection Reason (optional)" rows={3} value={statusForm.rejectionReason} onChange={e => setStatusForm(p => ({ ...p, rejectionReason: e.target.value }))} placeholder="Provide a reason to help the candidate improve..." />
 <div className="flex gap-3">
 <Button variant="danger" onClick={handleReject} loading={saving} className="flex-1">Reject</Button>
 <Button variant="secondary" onClick={() => setActionModal(null)}>Cancel</Button>
 </div>
 </div>
 </Modal>
 </div>
 );
}
