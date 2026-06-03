import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import { jobsAPI } from '../../services/api';
import { Card, Button, Badge, Modal, Input, Textarea, Select, EmptyState, Skeleton } from '../../components/ui';
import { JOB_TYPE_CONFIG, formatDate, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const defaultForm = { title: '', description: '', requirements: '', benefits: '', location: '', type: 'FULL_TIME', salaryMin: '', salaryMax: '', experience: '', deadline: '', skills: '' };

export default function CompanyJobs() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');

  const fetchJobs = async () => {
    const { data } = await jobsAPI.getCompanyJobs({ status: filter || undefined });
    setJobs(data.jobs);
    setTotal(data.total);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, [filter]);

  const openCreate = () => { setEditing(null); setForm(defaultForm); setModal(true); };
  const openEdit = (job) => {
    setEditing(job);
    setForm({ ...job, skills: job.skills?.join(', ') || '', deadline: job.deadline?.split('T')[0] || '' });
    setModal(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null, salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null, skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [] };
      if (editing) {
        const { data } = await jobsAPI.updateJob(editing.id, payload);
        setJobs(prev => prev.map(j => j.id === data.id ? data : j));
        toast.success('Job updated!');
      } else {
        const { data } = await jobsAPI.createJob(payload);
        setJobs(prev => [data, ...prev]);
        toast.success('Job posted!');
      }
      setModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const deleteJob = async (id) => {
    if (!window.confirm('Delete this job? All applications will be removed.')) return;
    await jobsAPI.deleteJob(id);
    setJobs(prev => prev.filter(j => j.id !== id));
    toast.success('Job deleted');
  };

  const toggleStatus = async (job) => {
    const newStatus = job.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    const { data } = await jobsAPI.updateJob(job.id, { status: newStatus });
    setJobs(prev => prev.map(j => j.id === data.id ? data : j));
    toast.success(`Job ${newStatus === 'ACTIVE' ? 'reopened' : 'closed'}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Posts</h1>
          <p className="text-gray-500 mt-1">{total} jobs posted</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Post New Job</Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[['', 'All'], ['ACTIVE', 'Active'], ['CLOSED', 'Closed'], ['DRAFT', 'Draft']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-all border', filter === val ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300')}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div>
      ) : jobs.length === 0 ? (
        <Card className="p-12">
          <EmptyState icon={Briefcase} title="No jobs yet" description="Post your first job to start receiving applications" action={<Button onClick={openCreate}><Plus size={16} /> Post Job</Button>} />
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, i) => {
            const typeCfg = JOB_TYPE_CONFIG[job.type] || {};
            return (
              <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                        <Badge className={typeCfg.color}>{typeCfg.label}</Badge>
                        <Badge className={job.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>{job.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{job.location} · Posted {formatDate(job.createdAt)}</p>
                      {job.skills?.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {job.skills.slice(0, 4).map(s => <Badge key={s} className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{s}</Badge>)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        <Users size={14} />
                        <span>{job._count?.applications || 0}</span>
                      </div>
                      <button onClick={() => toggleStatus(job)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title={job.status === 'ACTIVE' ? 'Close job' : 'Reopen job'}>
                        {job.status === 'ACTIVE' ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} className="text-gray-400" />}
                      </button>
                      <button onClick={() => openEdit(job)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <Edit2 size={16} className="text-gray-400" />
                      </button>
                      <button onClick={() => deleteJob(job.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Edit Job' : 'Post New Job'} size="xl">
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          <Input label="Job Title *" placeholder="e.g. Senior React Developer" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Job Type" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              {Object.entries(JOB_TYPE_CONFIG).map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
            </Select>
            <Input label="Location" placeholder="e.g. New York, NY or Remote" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
          </div>
          <Textarea label="Job Description *" rows={4} placeholder="Describe the role, responsibilities..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <Textarea label="Requirements" rows={3} placeholder="Required skills, experience..." value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} />
          <Textarea label="Benefits" rows={2} placeholder="Health insurance, flexible hours..." value={form.benefits} onChange={e => setForm(p => ({ ...p, benefits: e.target.value }))} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Min Salary" type="number" placeholder="50000" value={form.salaryMin} onChange={e => setForm(p => ({ ...p, salaryMin: e.target.value }))} />
            <Input label="Max Salary" type="number" placeholder="80000" value={form.salaryMax} onChange={e => setForm(p => ({ ...p, salaryMax: e.target.value }))} />
            <Input label="Experience" placeholder="3-5 years" value={form.experience} onChange={e => setForm(p => ({ ...p, experience: e.target.value }))} />
          </div>
          <Input label="Skills (comma-separated)" placeholder="React, Node.js, PostgreSQL" value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} />
          <Input label="Application Deadline" type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
        </div>
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={save} loading={saving} className="flex-1">{editing ? 'Update Job' : 'Post Job'}</Button>
          <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}

function Briefcase({ size, className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
}
