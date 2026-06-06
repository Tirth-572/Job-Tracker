import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Users, RefreshCw, XCircle, Eye, Calendar, Clock, Briefcase } from 'lucide-react';
import { jobsAPI } from '../../services/api';
import { Card, Button, Badge, Modal, Input, Textarea, Select, EmptyState, SkeletonCard } from '../../components/ui';
import { JOB_TYPE_CONFIG, formatDate, formatRelativeDate, cn } from '../../lib/utils';
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
  
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' or 'HISTORY'
  const [historyFilter, setHistoryFilter] = useState(''); // '', 'EXPIRED', 'CLOSED'

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    let statusFilter = '';
    if (activeTab === 'ACTIVE') {
      statusFilter = 'ACTIVE';
    } else {
      statusFilter = historyFilter || 'CLOSED,EXPIRED';
    }
    
    try {
      const { data } = await jobsAPI.getCompanyJobs({ status: statusFilter });
      setJobs(data.jobs);
      setTotal(data.total);
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [activeTab, historyFilter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const location = useLocation();
  useEffect(() => {
    if (location.state?.openCreate) {
      openCreate();
      window.history.replaceState({}, document.title)
    }
  }, [location.state]);

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
        if (activeTab === 'ACTIVE') {
          setJobs(prev => prev.map(j => j.id === data.id ? data : j));
        }
        toast.success('Job updated!');
      } else {
        const { data } = await jobsAPI.createJob(payload);
        if (activeTab === 'ACTIVE') {
          setJobs(prev => [data, ...prev]);
        } else {
          setActiveTab('ACTIVE');
        }
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

  const closeJob = async (id) => {
    if (!window.confirm('Are you sure you want to close this job? Candidates will no longer be able to apply.')) return;
    try {
      await jobsAPI.closeJob(id);
      toast.success('Job closed successfully');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to close job');
    }
  };

  const repostJob = async (id) => {
    try {
      const { data } = await jobsAPI.repostJob(id);
      toast.success('Job reposted successfully! Please review the details.');
      setActiveTab('ACTIVE');
      openEdit(data);
    } catch (error) {
      toast.error('Failed to repost job');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Job Posts</h1>
          <p className="page-subtitle">Manage your active and past job postings</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Post New Job</button>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-brand-primary/20">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={cn('px-6 py-4 font-bold text-sm transition-colors border-b-2', activeTab === 'ACTIVE' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-900')}
        >
          Active Jobs
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={cn('px-6 py-4 font-bold text-sm transition-colors border-b-2', activeTab === 'HISTORY' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-900')}
        >
          Job History
        </button>
      </div>

      {/* History Sub-Filter */}
      {activeTab === 'HISTORY' && (
        <div className="flex gap-3 pt-2">
          {[['', 'All History'], ['EXPIRED', 'Expired Jobs'], ['CLOSED', 'Closed Jobs']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setHistoryFilter(val)}
              className={cn('filter-pill', historyFilter === val ? 'filter-pill-active' : 'filter-pill-inactive')}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}</div>
      ) : jobs.length === 0 ? (
        <Card className="p-16">
          <EmptyState 
            icon={activeTab === 'ACTIVE' ? Briefcase : Clock} 
            title={activeTab === 'ACTIVE' ? "No active jobs" : "No job history"} 
            description={activeTab === 'ACTIVE' ? "Post your first job to start receiving applications" : "You haven't closed or expired any jobs yet."} 
            action={activeTab === 'ACTIVE' ? <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Post Job</button> : null} 
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {jobs.map((job, i) => {
            const typeCfg = JOB_TYPE_CONFIG[job.type] || {};
            return (
              <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="p-6 hover:border-brand-primary/30 transition-colors group">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                    
                    <div className="flex-1 min-w-0 space-y-3.5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-primary transition-colors">{job.title}</h3>
                        <Badge className={typeCfg.color}>{typeCfg.label}</Badge>
                        <Badge className={job.status === 'ACTIVE' ? 'bg-brand-bg text-brand-primary border-brand-primary/20' : job.status === 'CLOSED' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-red-50 text-red-500 border-red-100'}>
                          {job.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm font-medium text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1.5"><Briefcase size={16} className="text-gray-400" /> {job.location}</span>
                        <span className="flex items-center gap-1.5"><Users size={16} className="text-gray-400" /> {job._count?.applications || 0} Applications</span>
                        <span className="flex items-center gap-1.5"><Calendar size={16} className="text-gray-400" /> Posted {formatDate(job.createdAt)}</span>
                        {job.deadline && <span className="flex items-center gap-1.5 text-red-500"><Clock size={16} className="text-red-400" /> Deadline {formatDate(job.deadline)}</span>}
                        {activeTab === 'HISTORY' && job.closedAt && <span className="flex items-center gap-1.5"><Clock size={16} className="text-gray-400" /> Closed {formatDate(job.closedAt)}</span>}
                      </div>

                      {job.skills?.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {job.skills.slice(0, 4).map(s => <span key={s} className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-brand-primary/20 text-gray-600 shadow-sm">{s}</span>)}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0 md:flex-col md:items-end">
                      {activeTab === 'ACTIVE' ? (
                        <>
                          <button onClick={() => openEdit(job)} className="btn-ghost"><Edit2 size={16} /> Edit</button>
                          <button onClick={() => closeJob(job.id)} className="btn-secondary text-gray-600 bg-brand-bg"><XCircle size={16} /> Close Job</button>
                          <button onClick={() => deleteJob(job.id)} className="btn-danger"><Trash2 size={16} /> Delete</button>
                        </>
                      ) : (
                        <>
                          <Link to={`/company/applications?jobId=${job.id}`}>
                            <button className="btn-secondary text-brand-primary bg-brand-bg"><Users size={16} /> View Applicants</button>
                          </Link>
                          <button onClick={() => repostJob(job.id)} className="btn-primary"><RefreshCw size={16} /> Repost Job</button>
                        </>
                      )}
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
        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 pb-2">
          <Input label="Job Title *" placeholder="e.g. Senior React Developer" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Job Type" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              {Object.entries(JOB_TYPE_CONFIG).map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
            </Select>
            <Input label="Location" placeholder="e.g. New York, NY or Remote" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
          </div>
          <Textarea label="Job Description *" rows={4} placeholder="Describe the role, responsibilities..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          <Textarea label="Requirements" rows={3} placeholder="Required skills, experience..." value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} />
          <Textarea label="Benefits" rows={2} placeholder="Health insurance, flexible hours..." value={form.benefits} onChange={e => setForm(p => ({ ...p, benefits: e.target.value }))} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Min Salary (Optional)" type="number" placeholder="50000" value={form.salaryMin} onChange={e => setForm(p => ({ ...p, salaryMin: e.target.value }))} />
            <Input label="Max Salary (Optional)" type="number" placeholder="80000" value={form.salaryMax} onChange={e => setForm(p => ({ ...p, salaryMax: e.target.value }))} />
            <Input label="Experience (Optional)" placeholder="3-5 years" value={form.experience} onChange={e => setForm(p => ({ ...p, experience: e.target.value }))} />
          </div>
          <Input label="Skills (comma-separated)" placeholder="React, Node.js, PostgreSQL" value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} />
          <Input label="Application Deadline" type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
        </div>
        <div className="flex gap-4 mt-6 pt-5 border-t border-brand-primary/10">
          <button onClick={save} disabled={saving} className="btn-primary flex-1">{editing ? 'Update Job' : 'Post Job'}</button>
          <button onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
