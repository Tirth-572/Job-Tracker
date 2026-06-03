import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Filter, BookmarkPlus, BookmarkCheck, Briefcase, Building2, DollarSign, Clock, X } from 'lucide-react';
import { jobsAPI, candidateAPI, applicationAPI } from '../../services/api';
import { Card, Badge, Button, Skeleton, EmptyState, Modal, Textarea } from '../../components/ui';
import { STATUS_CONFIG, JOB_TYPE_CONFIG, formatSalary, formatRelativeDate, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE'];

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [applyModal, setApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [filters, setFilters] = useState({ search: '', type: '', location: '', page: 1 });
  const [showFilters, setShowFilters] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await jobsAPI.getJobs(filters);
      setJobs(data.jobs);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    candidateAPI.getSavedJobs().then(({ data }) => {
      setSavedJobs(new Set(data.map(s => s.jobId)));
    }).catch(() => {});
  }, []);

  const toggleSave = async (jobId, e) => {
    e.stopPropagation();
    if (savedJobs.has(jobId)) {
      await candidateAPI.unsaveJob(jobId);
      setSavedJobs(prev => { const s = new Set(prev); s.delete(jobId); return s; });
      toast.success('Removed from saved');
    } else {
      await candidateAPI.saveJob(jobId);
      setSavedJobs(prev => new Set([...prev, jobId]));
      toast.success('Job saved!');
    }
  };

  const handleApply = async () => {
    if (!selected) return;
    setApplying(true);
    try {
      await applicationAPI.apply({ jobId: selected.id, coverLetter });
      toast.success('Application submitted!');
      setApplyModal(false);
      setCoverLetter('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Browse Jobs</h1>
        <p className="text-gray-500 mt-1">{total.toLocaleString()} opportunities available</p>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-10"
              placeholder="Job title, company, keywords..."
              value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))}
            />
          </div>
          <div className="relative min-w-40">
            <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input pl-10"
              placeholder="Location"
              value={filters.location}
              onChange={e => setFilters(p => ({ ...p, location: e.target.value, page: 1 }))}
            />
          </div>
          <Button variant="secondary" onClick={() => setShowFilters(p => !p)}>
            <Filter size={16} /> Filters {filters.type && <Badge className="bg-primary-100 text-primary-700">1</Badge>}
          </Button>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
            {JOB_TYPES.map(type => {
              const cfg = JOB_TYPE_CONFIG[type];
              return (
                <button
                  key={type}
                  onClick={() => setFilters(p => ({ ...p, type: p.type === type ? '' : type, page: 1 }))}
                  className={cn('px-3 py-1.5 rounded-full text-sm font-medium border transition-all', filters.type === type ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300')}
                >
                  {cfg?.label || type}
                </button>
              );
            })}
            {(filters.type || filters.location || filters.search) && (
              <button onClick={() => setFilters({ search: '', type: '', location: '', page: 1 })} className="px-3 py-1.5 rounded-full text-sm text-red-500 border border-red-200 hover:bg-red-50 flex items-center gap-1">
                <X size={12} /> Clear all
              </button>
            )}
          </div>
        )}
      </Card>

      {/* Job List */}
      <div className="grid lg:grid-cols-2 gap-4">
        {loading
          ? [...Array(6)].map((_, i) => (
              <Card key={i} className="p-5 space-y-3">
                <div className="flex gap-3"><Skeleton className="w-12 h-12 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></div></div>
                <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" />
              </Card>
            ))
          : jobs.length === 0
          ? <div className="lg:col-span-2"><EmptyState icon={Briefcase} title="No jobs found" description="Try adjusting your search or filters" /></div>
          : jobs.map((job, idx) => {
              const typeCfg = JOB_TYPE_CONFIG[job.type] || {};
              const isSaved = savedJobs.has(job.id);
              return (
                <motion.div key={job.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                  <Card
                    className="p-5 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={() => setSelected(job)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        {job.company?.logo
                          ? <img src={job.company.logo} alt="" className="w-full h-full object-contain rounded-xl" />
                          : <Briefcase size={20} className="text-gray-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors truncate">{job.title}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                          <Building2 size={13} /> {job.company?.name}
                        </p>
                      </div>
                      <button
                        onClick={e => toggleSave(job.id, e)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                      >
                        {isSaved
                          ? <BookmarkCheck size={18} className="text-primary-600" />
                          : <BookmarkPlus size={18} className="text-gray-400" />
                        }
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><MapPin size={13} /> {job.location}</span>
                      {(job.salaryMin || job.salaryMax) && (
                        <span className="flex items-center gap-1"><DollarSign size={13} /> {formatSalary(job.salaryMin, job.salaryMax, job.currency)}</span>
                      )}
                      <span className="flex items-center gap-1"><Clock size={13} /> {formatRelativeDate(job.createdAt)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Badge className={typeCfg.color}>{typeCfg.label}</Badge>
                        {job.skills?.slice(0, 2).map(s => <Badge key={s} className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{s}</Badge>)}
                      </div>
                      <span className="text-xs text-gray-400">{job._count?.applications || 0} applicants</span>
                    </div>
                  </Card>
                </motion.div>
              );
            })
        }
      </div>

      {/* Pagination */}
      {total > 10 && (
        <div className="flex justify-center gap-2">
          <Button variant="secondary" disabled={filters.page === 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}>Previous</Button>
          <Button variant="secondary" disabled={jobs.length < 10} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}>Next</Button>
        </div>
      )}

      {/* Job Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.title} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {selected.company?.logo ? <img src={selected.company.logo} alt="" className="w-full h-full object-contain rounded-xl" /> : <Briefcase size={20} className="text-gray-400" />}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{selected.company?.name}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={13} /> {selected.location}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={JOB_TYPE_CONFIG[selected.type]?.color}>{JOB_TYPE_CONFIG[selected.type]?.label}</Badge>
              {(selected.salaryMin || selected.salaryMax) && <Badge className="bg-green-100 text-green-700">{formatSalary(selected.salaryMin, selected.salaryMax)}</Badge>}
            </div>

            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">{selected.description}</p>
            </div>

            {selected.requirements && (
              <div>
                <h4 className="font-semibold mb-2">Requirements</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">{selected.requirements}</p>
              </div>
            )}

            {selected.skills?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selected.skills.map(s => <Badge key={s} className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">{s}</Badge>)}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button onClick={() => { setApplyModal(true); }} className="flex-1">Apply Now</Button>
              <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Apply Modal */}
      <Modal isOpen={applyModal} onClose={() => setApplyModal(false)} title="Apply for this position" size="md">
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="font-medium">{selected?.title}</p>
            <p className="text-sm text-gray-500">{selected?.company?.name}</p>
          </div>
          <Textarea
            label="Cover Letter (optional)"
            placeholder="Tell the employer why you're a great fit..."
            rows={5}
            value={coverLetter}
            onChange={e => setCoverLetter(e.target.value)}
          />
          <div className="flex gap-3">
            <Button onClick={handleApply} loading={applying} className="flex-1">Submit Application</Button>
            <Button variant="secondary" onClick={() => setApplyModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
