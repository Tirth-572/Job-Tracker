import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, User, FileText, Calendar, ChevronDown, Download } from 'lucide-react';
import { applicationAPI } from '../../services/api';
import { Card, Badge, Button, Avatar, EmptyState, Skeleton, Modal, Select, Textarea, Input } from '../../components/ui';
import { STATUS_CONFIG, formatDate, formatRelativeDate, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const STATUSES = Object.keys(STATUS_CONFIG);

export default function CompanyApplications() {
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [statusModal, setStatusModal] = useState(false);
  const [interviewModal, setInterviewModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', notes: '', rejectionReason: '' });
  const [interviewForm, setInterviewForm] = useState({ type: 'VIDEO', duration: 60, scheduledAt: '', meetingLink: '' });
  const [saving, setSaving] = useState(false);

  const fetchApps = async () => {
    setLoading(true);
    const { data } = await applicationAPI.getCompanyApplications({ status: filter || undefined, page, limit: 15 });
    setApplications(data.applications);
    setTotal(data.total);
    setLoading(false);
  };

  useEffect(() => { fetchApps(); }, [filter, page]);

  const handleStatusUpdate = async () => {
    if (!statusForm.status) return;
    setSaving(true);
    try {
      await applicationAPI.updateStatus(selected.id, statusForm);
      setApplications(prev => prev.map(a => a.id === selected.id ? { ...a, status: statusForm.status } : a));
      toast.success('Status updated & email sent!');
      setStatusModal(false);
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Applications</h1>
        <p className="text-gray-500 mt-1">{total} total applications</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setFilter(''); setPage(1); }} className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-all border', !filter ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400')}>All</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }} className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-all border', filter === s ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300')}>
            {STATUS_CONFIG[s]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)}</div>
      ) : applications.length === 0 ? (
        <Card className="p-12"><EmptyState icon={FileText} title="No applications" description="No applications match the selected filter" /></Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['Candidate', 'Job', 'Applied', 'Status', 'Interview', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {applications.map((app, i) => {
                  const cfg = STATUS_CONFIG[app.status] || {};
                  const nextInterview = app.interviews?.[0];
                  return (
                    <motion.tr key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={`${app.candidate?.firstName} ${app.candidate?.lastName}`} src={app.candidate?.avatar} size="sm" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{app.candidate?.firstName} {app.candidate?.lastName}</p>
                            <p className="text-xs text-gray-400">{app.candidate?.location || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{app.job?.title}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatRelativeDate(app.appliedAt)}</td>
                      <td className="px-4 py-3"><Badge className={cfg.color}>{cfg.label}</Badge></td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {nextInterview ? (
                          <span className="flex items-center gap-1 text-purple-600"><Calendar size={12} /> {formatDate(nextInterview.scheduledAt)}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setSelected(app); setStatusForm({ status: app.status, notes: '', rejectionReason: '' }); setStatusModal(true); }}
                            className="px-2.5 py-1.5 text-xs bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 transition-colors"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => { setSelected(app); setInterviewModal(true); }}
                            className="px-2.5 py-1.5 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 transition-colors"
                          >
                            Interview
                          </button>
                          {app.candidate?.resumeUrl && (
                            <a href={app.candidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400">
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
            <div className="flex justify-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={applications.length < 15} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </Card>
      )}

      {/* Update Status Modal */}
      <Modal isOpen={statusModal} onClose={() => setStatusModal(false)} title="Update Application Status">
        <div className="space-y-3">
          {selected && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium">{selected.candidate?.firstName} {selected.candidate?.lastName}</p>
              <p className="text-sm text-gray-500">{selected.job?.title}</p>
            </div>
          )}
          <Select label="New Status" value={statusForm.status} onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))}>
            <option value="">Select status...</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>)}
          </Select>
          <Textarea label="Internal Notes (not sent to candidate)" rows={2} value={statusForm.notes} onChange={e => setStatusForm(p => ({ ...p, notes: e.target.value }))} />
          {statusForm.status === 'REJECTED' && (
            <Textarea label="Rejection Reason (sent to candidate)" rows={2} value={statusForm.rejectionReason} onChange={e => setStatusForm(p => ({ ...p, rejectionReason: e.target.value }))} />
          )}
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-xs text-amber-700 dark:text-amber-400">
            ⚡ An automatic email will be sent to the candidate when you update the status.
          </div>
          <div className="flex gap-3">
            <Button onClick={handleStatusUpdate} loading={saving} className="flex-1">Update Status</Button>
            <Button variant="secondary" onClick={() => setStatusModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Interview Modal */}
      <Modal isOpen={interviewModal} onClose={() => setInterviewModal(false)} title="Schedule Interview">
        <div className="space-y-3">
          <Select label="Type" value={interviewForm.type} onChange={e => setInterviewForm(p => ({ ...p, type: e.target.value }))}>
            <option value="VIDEO">Video Call</option>
            <option value="PHONE">Phone</option>
            <option value="IN_PERSON">In Person</option>
            <option value="TECHNICAL">Technical</option>
          </Select>
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
