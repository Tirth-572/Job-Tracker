import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar, Download } from 'lucide-react';
import { applicationAPI, workflowAPI } from '../../services/api';
import { Card, Badge, Button, Avatar, EmptyState, Modal, Select, Textarea, Input } from '../../components/ui';
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
 <div className="max-w-7xl mx-auto space-y-5">
 <div>
 <h1 className="text-2xl font-bold text-gray-900 ">Applications</h1>
 <p className="text-gray-500 mt-1">{total} total applications</p>
 </div>

 <div className="flex flex-wrap gap-2">
 <button onClick={() => { setFilter(''); setPage(1); }} className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-all border', !filter ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 ')}>All</button>
 {stages.map(s => (
 <button key={s.id} onClick={() => { setFilter(s.id); setPage(1); }} className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-all border', filter === s.id ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
 {s.name}
 </button>
 ))}
 </div>

 {loading ? (
 <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-xl bg-gray-200 animate-pulse" />)}</div>
 ) : applications.length === 0 ? (
 <Card className="p-12"><EmptyState icon={FileText} title="No applications" description="No applications match the selected filter" /></Card>
 ) : (
 <Card className="overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-gray-50 border-b border-gray-200 ">
 <tr>
 {['Candidate', 'Job', 'Applied', 'Stage', 'Interview', 'Actions'].map(h => (
 <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100 ">
 {applications.map((app, i) => {
 const stage = app.stage || stages.find(s => s.systemType === 'APPLIED');
 const nextInterview = app.interviews?.[0];
 return (
 <motion.tr key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-gray-50 :bg-gray-800/50 transition-colors">
 <td className="px-4 py-3">
 <div className="flex items-center gap-2">
 <Avatar name={`${app.candidate?.firstName} ${app.candidate?.lastName}`} src={getFileUrl(app.candidate?.avatar)} size="sm" />
 <div>
 <p className="font-medium text-gray-900 ">{app.candidate?.firstName} {app.candidate?.lastName}</p>
 <p className="text-xs text-gray-400">{app.candidate?.location || '—'}</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-3 text-gray-600 ">{app.job?.title}</td>
 <td className="px-4 py-3 text-gray-400 text-xs">{formatRelativeDate(app.appliedAt)}</td>
 <td className="px-4 py-3"><Badge className={stage?.color || 'bg-gray-100 text-gray-700'}>{stage?.name || 'Applied'}</Badge></td>
 <td className="px-4 py-3 text-xs text-gray-400">
 {nextInterview ? (
 <span className="flex flex-col gap-0.5 text-purple-600">
 <span className="font-medium">{nextInterview.customTypeName || stage?.name}</span>
 <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(nextInterview.scheduledAt)}</span>
 </span>
 ) : '—'}
 </td>
 <td className="px-4 py-3">
 <div className="flex gap-1">
 <button
 onClick={() => { setSelected(app); setStatusForm({ stageId: app.stageId, notes: app.notes || '', rejectionReason: app.rejectionReason || '' }); setStatusModal(true); }}
 className="px-2.5 py-1.5 text-xs bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
 >
 Update
 </button>
 <button
 onClick={() => { setSelected(app); setInterviewForm(p => ({ ...p, customTypeName: stage?.name || 'Interview' })); setInterviewModal(true); }}
 className="px-2.5 py-1.5 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
 >
 Interview
 </button>
 {app.candidate?.resumeUrl && (
 <a href={app.candidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-gray-100 :bg-gray-700 rounded-lg text-gray-400">
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
 <div className="flex justify-center gap-2 p-4 border-t border-gray-200 ">
 <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
 <Button variant="secondary" size="sm" disabled={applications.length < 15} onClick={() => setPage(p => p + 1)}>Next</Button>
 </div>
 )}
 </Card>
 )}

 {/* Update Status Modal */}
 <Modal isOpen={statusModal} onClose={() => setStatusModal(false)} title="Update Application Stage">
 <div className="space-y-3">
 {selected && (
 <div className="p-3 bg-gray-50 rounded-lg">
 <p className="font-medium">{selected.candidate?.firstName} {selected.candidate?.lastName}</p>
 <p className="text-sm text-gray-500">{selected.job?.title}</p>
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
 <div className="bg-amber-50 p-3 rounded-lg text-xs text-amber-700 ">
 ⚡ An automatic notification will be sent to the candidate when you update the stage.
 </div>
 <div className="flex gap-3">
 <Button onClick={handleStatusUpdate} loading={saving} className="flex-1">Update Stage</Button>
 <Button variant="secondary" onClick={() => setStatusModal(false)}>Cancel</Button>
 </div>
 </div>
 </Modal>

 {/* Interview Modal */}
 <Modal isOpen={interviewModal} onClose={() => setInterviewModal(false)} title="Schedule Interview">
 <div className="space-y-3">
 <Input label="Interview Name" value={interviewForm.customTypeName || ''} onChange={e => setInterviewForm(p => ({ ...p, customTypeName: e.target.value }))} required />
 <Input label="Date & Time" type="datetime-local" value={interviewForm.scheduledAt} onChange={e => setInterviewForm(p => ({ ...p, scheduledAt: e.target.value }))} />
 <Input label="Duration (minutes)" type="number" value={interviewForm.duration} onChange={e => setInterviewForm(p => ({ ...p, duration: parseInt(e.target.value) }))} />
 <Input label="Meeting Link" placeholder="https://meet.google.com/..." value={interviewForm.meetingLink} onChange={e => setInterviewForm(p => ({ ...p, meetingLink: e.target.value }))} />
 <div className="flex gap-3">
 <Button onClick={handleScheduleInterview} loading={saving} className="flex-1">Schedule</Button>
 <Button variant="secondary" onClick={() => setInterviewModal(false)}>Cancel</Button>
 </div>
 </div>
 </Modal>
 </div>
 );
}
