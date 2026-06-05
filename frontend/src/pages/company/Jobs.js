import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Users, RefreshCw, XCircle, Eye, Calendar, Clock } from 'lucide-react';
import { jobsAPI } from '../../services/api';
import { Card, Button, Badge, Modal, Input, Textarea, Select, EmptyState, Skeleton } from '../../components/ui';
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
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Job Posts</h1>
          <p className="text-[#64748B] mt-1">Manage your active and past job postings</p>
        </div>
        <Button onClick={openCreate} className="bg-[#635BFF] hover:bg-[#5146E5] text-white"><Plus size={16} /> Post New Job</Button>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-[#E2E8F0]">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={cn('px-6 py-3 font-medium text-sm transition-colors border-b-2', activeTab === 'ACTIVE' ? 'border-[#635BFF] text-[#635BFF]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]')}
        >
          Active Jobs
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={cn('px-6 py-3 font-medium text-sm transition-colors border-b-2', activeTab === 'HISTORY' ? 'border-[#635BFF] text-[#635BFF]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]')}
        >
          Job History
        </button>
      </div>

      {/* History Sub-Filter */}
      {activeTab === 'HISTORY' && (
        <div className="flex gap-2">
          {[['', 'All History'], ['EXPIRED', 'Expired Jobs'], ['CLOSED', 'Closed Jobs']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setHistoryFilter(val)}
              className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-all border', historyFilter === val ? 'bg-[#635BFF]/10 text-[#635BFF] border-[#635BFF]/20' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]')}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div>
      ) : jobs.length === 0 ? (
        <Card className="p-12">
          <EmptyState 
            icon={activeTab === 'ACTIVE' ? Briefcase : Clock} 
            title={activeTab === 'ACTIVE' ? "No active jobs" : "No job history"} 
            description={activeTab === 'ACTIVE' ? "Post your first job to start receiving applications" : "You haven't closed or expired any jobs yet."} 
            action={activeTab === 'ACTIVE' ? <Button onClick={openCreate} className="bg-[#635BFF] hover:bg-[#5146E5] text-white"><Plus size={16} /> Post Job</Button> : null} 
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job, i) => {
            const typeCfg = JOB_TYPE_CONFIG[job.type] || {};
            return (
              <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-[#0F172A]">{job.title}</h3>
                        <Badge className={typeCfg.color}>{typeCfg.label}</Badge>
                        <Badge className={job.status === 'ACTIVE' ? 'bg-[#22C55E]/10 text-[#22C55E]' : job.status === 'CLOSED' ? 'bg-[#64748B]/10 text-[#64748B]' : 'bg-[#EF4444]/10 text-[#EF4444]'}>
                          {job.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-[#64748B] flex-wrap">
                        <span className="flex items-center gap-1.5"><Briefcase size={14} /> {job.location}</span>
                        <span className="flex items-center gap-1.5"><Users size={14} /> {job._count?.applications || 0} Applications</span>
                        <span className="flex items-center gap-1.5"><Calendar size={14} /> Posted {formatDate(job.createdAt)}</span>
                        {job.deadline && <span className="flex items-center gap-1.5 text-[#EF4444]"><Clock size={14} /> Deadline {formatDate(job.deadline)}</span>}
                        {activeTab === 'HISTORY' && job.closedAt && <span className="flex items-center gap-1.5"><Clock size={14} /> Closed {formatDate(job.closedAt)}</span>}
                      </div>

                      {job.skills?.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {job.skills.slice(0, 4).map(s => <Badge key={s} className="bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] font-medium">{s}</Badge>)}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 md:flex-col md:items-end">
                      {activeTab === 'ACTIVE' ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => openEdit(job)}><Edit2 size={14} /> Edit</Button>
                          <Button variant="danger" size="sm" onClick={() => closeJob(job.id)}><XCircle size={14} /> Close Job</Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteJob(job.id)} className="text-[#EF4444] hover:bg-red-50 hover:text-[#EF4444]"><Trash2 size={14} /> Delete</Button>
                        </>
                      ) : (
                        <>
                          <Link to={`/company/applications?jobId=${job.id}`}>
                            <Button variant="outline" size="sm"><Users size={14} /> View Applicants</Button>
                          </Link>
                          <Button variant="primary" size="sm" onClick={() => repostJob(job.id)} className="bg-[#635BFF] hover:bg-[#5146E5] text-white"><RefreshCw size={14} /> Repost Job</Button>
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
        <div className="flex gap-3 mt-4 pt-4 border-t border-[#E2E8F0]">
          <Button onClick={save} loading={saving} className="flex-1 bg-[#635BFF] hover:bg-[#5146E5] text-white">{editing ? 'Update Job' : 'Post Job'}</Button>
          <Button variant="outline" onClick={() => setModal(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}

function Briefcase({ size, className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
}
