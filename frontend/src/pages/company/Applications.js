import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Download } from 'lucide-react';
import { applicationAPI, workflowAPI } from '../../services/api';
import { Card, Badge, Button, Avatar, EmptyState, Modal, Select, Textarea, Input, SkeletonCard } from '../../components/ui';
import { formatDate, formatRelativeDate, cn, getFileUrl } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function CompanyApplications() {
 const [applications, setApplications] = useState([]);
 const [stages, setStages] = useState([]);
 const [total, setTotal] = useState(0);
 const [loading, setLoading] = useState(true);
 const [filter, setFilter] = useState('');
 const [page, setPage] = useState(1);
 const [selected, setSelected] = useState(null);
 const [viewModal, setViewModal] = useState(false);
 const [statusModal, setStatusModal] = useState(false);
 const [interviewModal, setInterviewModal] = useState(false);
 const [statusForm, setStatusForm] = useState({ stageId: '', notes: '', rejectionReason: '' });
 const [interviewForm, setInterviewForm] = useState({ duration: 60, scheduledAt: '', meetingLink: '', customTypeName: 'Interview' });
 const [saving, setSaving] = useState(false);

 const fetchApps = useCallback(async () => {
 setLoading(true);
 try {
 const [appsRes, stagesRes] = await Promise.all([
 applicationAPI.getCompanyApplications({ stageId: filter || undefined, page, limit: 15 }),
 workflowAPI.getWorkflows()
 ]);
 setApplications(appsRes.data.applications);
 setTotal(appsRes.data.total);
 setStages(stagesRes.data);
 } catch (err) {
 toast.error('Failed to load applications');
 } finally {
 setLoading(false);
 }
 }, [filter, page]);

 useEffect(() => { fetchApps(); }, [fetchApps]);

 const handleStatusUpdate = async () => {
 if (!statusForm.stageId) {
 toast.error('Please select a stage first!');
 return;
 }
 setSaving(true);
 try {
 const targetStage = stages.find(s => s.id === statusForm.stageId);
 const isRejected = targetStage?.systemType === 'REJECTED';
 
 await applicationAPI.updateStatus(selected.id, { 
 stageId: statusForm.stageId,
 notes: statusForm.notes,
 rejectionReason: isRejected ? statusForm.rejectionReason : null,
 status: isRejected ? 'REJECTED' : undefined // Trigger rejection logic if needed
 });
 toast.success('Status updated!');
 setStatusModal(false);
 fetchApps();
 } catch (err) { 
 toast.error(err.response?.data?.message || 'Update failed'); 
 } finally { 
 setSaving(false); 
 }
 };

 const handleScheduleInterview = async () => {
 setSaving(true);
 try {
 await applicationAPI.scheduleInterview(selected.id, interviewForm);
 toast.success('Interview scheduled!');
 setInterviewModal(false);
 fetchApps();
 } catch { toast.error('Failed to schedule'); }
 finally { setSaving(false); }
 };

 return (
 <div className="max-w-7xl mx-auto space-y-6">
 <div className="page-header">
 <h1 className="page-title">Applications</h1>
 <p className="page-subtitle">{total} total applications received</p>
 </div>

 <div className="flex flex-wrap gap-3">
 <button onClick={() => { setFilter(''); setPage(1); }} className={cn('filter-pill', !filter ? 'filter-pill-active' : 'filter-pill-inactive')}>All</button>
 {stages.map(s => (
 <button key={s.id} onClick={() => { setFilter(s.id); setPage(1); }} className={cn('filter-pill', filter === s.id ? 'filter-pill-active' : 'filter-pill-inactive')}>
 {s.name}
 </button>
 ))}
 </div>

 {loading ? (
 <div className="space-y-4">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
 ) : applications.length === 0 ? (
 <Card className="p-16"><EmptyState icon={FileText} title="No applications" description="No applications match the selected filter" /></Card>
 ) : (
 <Card className="overflow-hidden border border-brand-primary/10">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-brand-surface border-b border-brand-primary/20">
 <tr>
 {['Candidate', 'Job', 'Applied', 'Stage', 'Actions'].map(h => (
 <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-brand-primary/10">
 {applications.map((app, i) => {
 const stage = app.stage || stages.find(s => s.systemType === 'APPLIED');
 const nextInterview = app.interviews?.[0];
 return (
 <motion.tr key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-brand-bg transition-colors">
 <td className="px-5 py-4">
 <div className="flex items-center gap-3">
 <Avatar name={`${app.candidate?.firstName} ${app.candidate?.lastName}`} src={getFileUrl(app.candidate?.avatar)} size="sm" />
 <div>
 <p className="font-bold text-gray-900 ">{app.candidate?.firstName} {app.candidate?.lastName}</p>
 <p className="text-xs font-medium text-gray-500 truncate w-48" title={app.candidate?.user?.email || app.candidate?.location}>
 {app.candidate?.user?.email || app.candidate?.location || '—'}
 </p>
 </div>
 </div>
 </td>
 <td className="px-5 py-4 font-bold text-gray-900">{app.job?.title}</td>
 <td className="px-5 py-4 text-gray-500 font-medium text-xs">{formatRelativeDate(app.appliedAt)}</td>
 <td className="px-5 py-4"><Badge className={stage?.color || 'bg-brand-bg text-brand-primary'}>{stage?.name || 'Applied'}</Badge></td>

 <td className="px-5 py-4">
 <div className="flex gap-2">
 <button
 onClick={() => { setSelected(app); setViewModal(true); }}
 className="px-3 py-1.5 text-xs font-bold bg-white text-gray-600 rounded-xl hover:bg-brand-primary/10 hover:text-brand-primary border border-brand-primary/20 transition-colors shadow-sm"
 >
 View
 </button>
 <button
 onClick={() => { setSelected(app); setStatusForm({ stageId: app.stageId, notes: app.notes || '', rejectionReason: app.rejectionReason || '' }); setStatusModal(true); }}
 className="px-3 py-1.5 text-xs font-bold bg-white text-gray-600 rounded-xl hover:bg-brand-primary/10 hover:text-brand-primary border border-brand-primary/20 transition-colors shadow-sm"
 >
 Update
 </button>
 <button
 onClick={() => { setSelected(app); setInterviewForm(p => ({ ...p, customTypeName: stage?.name || 'Interview' })); setInterviewModal(true); }}
 className="px-3 py-1.5 text-xs font-bold bg-white text-brand-primary rounded-xl hover:bg-brand-primary hover:text-white border border-brand-primary transition-all shadow-sm"
 >
 Interview
 </button>
 {(app.resumeUrl || app.candidate?.resumeUrl) && (
 <a href={getFileUrl(app.resumeUrl || app.candidate?.resumeUrl)} target="_blank" rel="noopener noreferrer" className="p-2 bg-brand-surface hover:bg-brand-primary hover:text-white rounded-xl text-brand-primary transition-all shadow-sm border border-brand-primary/20 flex items-center justify-center">
 <Download size={14} />
 </a>
 )}
 </div>
 </td>
 </motion.tr>
 );
 })}
 </tbody>
 </table>
 </div>
 {total > 15 && (
 <div className="flex justify-center gap-3 p-5 border-t border-brand-primary/10 bg-brand-surface">
 <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
 <Button variant="secondary" size="sm" disabled={applications.length < 15} onClick={() => setPage(p => p + 1)}>Next</Button>
 </div>
 )}
 </Card>
 )}

 {/* View Modal */}
 <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Application Details" size="lg">
 {selected && (
 <div className="space-y-5">
 <div className="p-5 bg-brand-surface rounded-2xl border border-brand-primary/20 flex items-center gap-4">
 <Avatar name={`${selected.candidate?.firstName} ${selected.candidate?.lastName}`} src={getFileUrl(selected.candidate?.avatar)} size="md" />
 <div>
 <h3 className="font-bold text-gray-900 text-lg">{selected.candidate?.firstName} {selected.candidate?.lastName}</h3>
 <p className="text-sm font-medium text-gray-500">{selected.candidate?.user?.email || selected.candidate?.location || 'Candidate'}</p>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="p-4 bg-brand-bg rounded-xl border border-brand-primary/10">
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Applied for</p>
 <p className="font-bold text-brand-primary">{selected.job?.title}</p>
 </div>
 <div className="p-4 bg-brand-bg rounded-xl border border-brand-primary/10">
 <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Applied Date</p>
 <p className="font-bold text-gray-900">{new Date(selected.appliedAt).toLocaleString()}</p>
 </div>
 </div>
 {(selected.resumeUrl || selected.candidate?.resumeUrl) && (
 <div>
 <p className="text-sm font-bold text-gray-900 mb-2">Resume</p>
 <iframe 
 src={getFileUrl(selected.resumeUrl || selected.candidate?.resumeUrl)} 
 className="w-full h-[400px] border border-brand-primary/20 rounded-2xl shadow-soft"
 title="Resume PDF"
 />
 <div className="mt-3 text-right">
 <a href={getFileUrl(selected.resumeUrl || selected.candidate?.resumeUrl)} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-brand-primary hover:text-brand-secondary transition-colors">
 Open in new tab
 </a>
 </div>
 </div>
 )}
 <div className="pt-6 border-t border-brand-primary/10 flex gap-4">
 <button onClick={() => setViewModal(false)} className="btn-ghost flex-1">Close</button>
 </div>
 </div>
 )}
 </Modal>

 {/* Update Status Modal */}
 <Modal isOpen={statusModal} onClose={() => setStatusModal(false)} title="Update Application Stage">
 <div className="space-y-4">
 {selected && (
 <div className="p-4 bg-brand-bg rounded-xl border border-brand-primary/20">
 <p className="font-bold text-gray-900">{selected.candidate?.firstName} {selected.candidate?.lastName}</p>
 <p className="text-sm font-medium text-gray-500 mt-1">{selected.job?.title}</p>
 </div>
 )}
 <Select label="New Stage" value={statusForm.stageId} onChange={e => setStatusForm(p => ({ ...p, stageId: e.target.value }))}>
 <option value="">Select stage...</option>
 {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
 </Select>
 <Textarea label="Internal Notes (not sent to candidate)" rows={2} value={statusForm.notes} onChange={e => setStatusForm(p => ({ ...p, notes: e.target.value }))} />
 {stages.find(s => s.id === statusForm.stageId)?.systemType === 'REJECTED' && (
 <Textarea label="Rejection Reason (sent to candidate)" rows={2} value={statusForm.rejectionReason} onChange={e => setStatusForm(p => ({ ...p, rejectionReason: e.target.value }))} />
 )}
 <div className="bg-brand-surface p-4 rounded-xl text-sm text-brand-primary font-medium border border-brand-primary/30 flex items-start gap-2">
 <span className="text-brand-primary">⚡</span>
 An automatic notification will be sent to the candidate when you update the stage.
 </div>
 <div className="flex gap-4 mt-6 pt-6 border-t border-brand-primary/10">
 <button onClick={handleStatusUpdate} disabled={saving} className="btn-primary flex-1">Update Stage</button>
 <button onClick={() => setStatusModal(false)} className="btn-ghost">Cancel</button>
 </div>
 </div>
 </Modal>

 {/* Interview Modal */}
 <Modal isOpen={interviewModal} onClose={() => setInterviewModal(false)} title="Schedule Interview">
 <div className="space-y-4">
 <Input label="Interview Name" value={interviewForm.customTypeName || ''} onChange={e => setInterviewForm(p => ({ ...p, customTypeName: e.target.value }))} required />
 <Input label="Date & Time" type="datetime-local" value={interviewForm.scheduledAt} onChange={e => setInterviewForm(p => ({ ...p, scheduledAt: e.target.value }))} />
 <Input label="Duration (minutes)" type="number" value={interviewForm.duration} onChange={e => setInterviewForm(p => ({ ...p, duration: parseInt(e.target.value) }))} />
 <Input label="Meeting Link" placeholder="https://meet.google.com/..." value={interviewForm.meetingLink} onChange={e => setInterviewForm(p => ({ ...p, meetingLink: e.target.value }))} />
 <div className="flex gap-4 mt-6 pt-6 border-t border-brand-primary/10">
 <button onClick={handleScheduleInterview} disabled={saving} className="btn-primary flex-1">Schedule</button>
 <button onClick={() => setInterviewModal(false)} className="btn-ghost">Cancel</button>
 </div>
 </div>
 </Modal>
 </div>
 );
}
