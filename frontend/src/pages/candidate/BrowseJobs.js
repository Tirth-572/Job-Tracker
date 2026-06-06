import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, BookmarkPlus, BookmarkCheck,
  Briefcase, Building2, DollarSign, Clock, X, SlidersHorizontal,
  Users, ChevronLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { jobsAPI, candidateAPI, applicationAPI } from '../../services/api';
import { Card, Badge, Button, Skeleton, EmptyState, Modal, Textarea } from '../../components/ui';
import { STATUS_CONFIG as _STATUS_CONFIG, JOB_TYPE_CONFIG, formatSalary, formatRelativeDate, cn, getFileUrl } from '../../lib/utils';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE'];

const JobCardSkeleton = () => (
  <Card className="p-5 space-y-3" flat>
    <div className="flex items-center gap-3">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="w-7 h-7 rounded-lg" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-20" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  </Card>
);

export default function BrowseJobs() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [applyModal, setApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [applying, setApplying] = useState(false);
  const [filters, setFilters] = useState({ search: '', type: '', location: '', page: 1 });
  const [showFilters, setShowFilters] = useState(false);

  // Sync with global search if navigated via DashboardLayout
  useEffect(() => {
    if (location.state?.search !== undefined) {
        setFilters(p => ({ ...p, search: location.state.search, page: 1 }));
        // Clean up state so refreshing doesn't keep triggering it
        window.history.replaceState({}, document.title);
    }
  }, [location.state?.search]);

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
    }).catch(() => { });
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
    if (!resumeFile && !user?.candidate?.resumeUrl) {
      return toast.error('A resume is required to apply');
    }
    setApplying(true);
    try {
      if (resumeFile) {
        const fd = new FormData();
        fd.append('resume', resumeFile);
        await candidateAPI.uploadResume(fd);
        await refreshUser();
      }
      await applicationAPI.apply({ jobId: selected.id, coverLetter });
      toast.success('Application submitted!');
      setApplyModal(false);
      setCoverLetter('');
      setResumeFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const activeFilterCount = [filters.type, filters.location, filters.search].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Browse Jobs</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading...' : `${total.toLocaleString()} opportunities available`}
          </p>
        </div>
      </div>

      {/* ── Search & Filters ──────────────────────────────────── */}
      <Card className="p-4" flat>
        <div className="flex gap-3 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-52 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              className="input pl-9"
              placeholder="Job title, company, skills..."
              value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))}
            />
          </div>
          {/* Location */}
          <div className="relative min-w-44">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              className="input pl-9"
              placeholder="Location"
              value={filters.location}
              onChange={e => setFilters(p => ({ ...p, location: e.target.value, page: 1 }))}
            />
          </div>
          {/* Filter toggle */}
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            onClick={() => setShowFilters(p => !p)}
            className="shrink-0"
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-[#635BFF] text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-1">Type:</span>
                {JOB_TYPES.map(type => {
                  const cfg = JOB_TYPE_CONFIG[type];
                  const active = filters.type === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setFilters(p => ({ ...p, type: p.type === type ? '' : type, page: 1 }))}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200',
                        active
                          ? 'bg-[#635BFF] text-white border-[#635BFF] shadow-sm'
                          : 'border-slate-200 text-slate-500 hover:border-[#635BFF]/40 hover:text-[#635BFF] hover:bg-[#635BFF]/5'
                      )}
                    >
                      {cfg?.label || type}
                    </button>
                  );
                })}
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => setFilters({ search: '', type: '', location: '', page: 1 })}
                    className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full text-xs text-red-500 border border-red-200 hover:bg-red-50 transition-colors font-medium"
                  >
                    <X size={11} /> Clear all
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* ── Job Grid ──────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {loading
          ? [...Array(6)].map((_, i) => <JobCardSkeleton key={i} />)
          : jobs.length === 0
            ? (
              <div className="lg:col-span-2">
                <Card className="p-8">
                  <EmptyState
                    icon={Briefcase}
                    title="No jobs found"
                    description="Try adjusting your search or clearing the filters."
                    action={
                      <button
                        onClick={() => setFilters({ search: '', type: '', location: '', page: 1 })}
                        className="btn-secondary text-sm"
                      >
                        <X size={14} /> Clear filters
                      </button>
                    }
                  />
                </Card>
              </div>
            )
            : jobs.map((job, idx) => {
              const typeCfg = JOB_TYPE_CONFIG[job.type] || {};
              const isSaved = savedJobs.has(job.id);
              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card
                    className="p-5 cursor-pointer group"
                    onClick={() => setSelected(job)}
                  >
                    {/* Top row */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden">
                        {job.company?.logo
                          ? <img src={getFileUrl(job.company.logo)} alt="" className="w-full h-full object-contain" />
                          : <Briefcase size={18} className="text-slate-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-[#0F172A] group-hover:text-[#635BFF] transition-colors truncate">
                          {job.title}
                        </h3>
                        <Link
                          to={`/candidate/company/${job.companyId || job.company?.id}`}
                          onClick={e => e.stopPropagation()}
                          className="text-xs text-slate-400 hover:text-[#635BFF] flex items-center gap-1 mt-0.5 w-fit transition-colors"
                        >
                          <Building2 size={11} /> {job.company?.name}
                        </Link>
                      </div>
                      <button
                        onClick={e => toggleSave(job.id, e)}
                        className={cn(
                          'p-1.5 rounded-xl transition-all duration-200 shrink-0',
                          isSaved
                            ? 'bg-[#635BFF]/10 text-[#635BFF]'
                            : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'
                        )}
                      >
                        {isSaved
                          ? <BookmarkCheck size={16} />
                          : <BookmarkPlus size={16} />
                        }
                      </button>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {job.location}
                      </span>
                      {(job.salaryMin || job.salaryMax) && (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <DollarSign size={11} /> {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {formatRelativeDate(job.createdAt)}
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge className={typeCfg.color}>{typeCfg.label}</Badge>
                        {job.skills?.slice(0, 2).map(s => (
                          <Badge key={s} className="bg-slate-100 text-slate-500 border-slate-200">{s}</Badge>
                        ))}
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                        <Users size={11} /> {job._count?.applications || 0}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              );
            })
        }
      </div>

      {/* ── Pagination ─────────────────────────────────────────── */}
      {total > 10 && (
        <div className="flex justify-center items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={filters.page === 1}
            onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
          >
            <ChevronLeft size={15} /> Previous
          </Button>
          <span className="text-sm text-slate-500 font-medium">Page {filters.page}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={jobs.length < 10}
            onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
          >
            Next <ChevronRightIcon size={15} />
          </Button>
        </div>
      )}

      {/* ── Job Detail Modal ───────────────────────────────────── */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.title} size="lg">
        {selected && (
          <div className="space-y-5">
            {/* Company header */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden shadow-sm">
                {selected.company?.logo
                  ? <img src={getFileUrl(selected.company.logo)} alt="" className="w-full h-full object-contain" />
                  : <Briefcase size={22} className="text-slate-400" />
                }
              </div>
              <div>
                <Link
                  to={`/candidate/company/${selected.companyId || selected.company?.id}`}
                  className="font-bold text-[#0F172A] hover:text-[#635BFF] transition-colors"
                >
                  {selected.company?.name}
                </Link>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin size={11} /> {selected.company?.location || selected.location}</span>
                  {selected.company?.industry && <span>🏢 {selected.company.industry}</span>}
                  {selected.company?.user?.email && <span>✉️ {selected.company.user.email}</span>}
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className={JOB_TYPE_CONFIG[selected.type]?.color}>
                {JOB_TYPE_CONFIG[selected.type]?.label}
              </Badge>
              {selected.location && (
                <Badge className="bg-slate-100 text-slate-500 border-slate-200">
                  <MapPin size={11} className="mr-1" /> {selected.location}
                </Badge>
              )}
              {(selected.salaryMin || selected.salaryMax) && (
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">
                  💰 {formatSalary(selected.salaryMin, selected.salaryMax)}
                </Badge>
              )}
            </div>

            {/* Description */}
            <div>
              <h4 className="font-semibold text-sm text-[#0F172A] mb-2">Description</h4>
              <p className="text-sm text-slate-500 whitespace-pre-wrap leading-relaxed">{selected.description}</p>
            </div>

            {selected.requirements && (
              <div>
                <h4 className="font-semibold text-sm text-[#0F172A] mb-2">Requirements</h4>
                <p className="text-sm text-slate-500 whitespace-pre-wrap leading-relaxed">{selected.requirements}</p>
              </div>
            )}

            {selected.skills?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-[#0F172A] mb-2">Skills Required</h4>
                <div className="flex flex-wrap gap-2">
                  {selected.skills.map(s => (
                    <Badge key={s} className="bg-[#635BFF]/10 text-[#635BFF] border-[#635BFF]/20">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action */}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              {selected.status === 'ACTIVE' ? (
                <Button
                  onClick={() => { setApplyModal(true); }}
                  className="flex-1"
                  size="lg"
                >
                  Apply Now
                </Button>
              ) : (
                <div className="flex-1 p-3 bg-red-50 text-red-500 rounded-xl text-center text-sm font-semibold border border-red-100">
                  Applications Closed
                </div>
              )}
              <Button variant="secondary" onClick={() => setSelected(null)} size="lg">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Apply Modal ────────────────────────────────────────── */}
      <Modal isOpen={applyModal} onClose={() => setApplyModal(false)} title="Apply for this position" size="md">
        <div className="space-y-4">
          {/* Job summary */}
          <div className="flex items-center gap-3 p-3.5 bg-[#635BFF]/5 rounded-xl border border-[#635BFF]/15">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
              {selected?.company?.logo
                ? <img src={getFileUrl(selected.company.logo)} alt="" className="w-full h-full object-contain" />
                : <Briefcase size={16} className="text-slate-400" />
              }
            </div>
            <div>
              <p className="font-semibold text-sm text-[#0F172A]">{selected?.title}</p>
              <p className="text-xs text-slate-400">{selected?.company?.name}</p>
            </div>
          </div>

          {/* Resume upload */}
          <div>
            <label className="label">Resume <span className="text-red-400 normal-case text-xs font-normal">(required)</span></label>
            <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-[#635BFF]/40 hover:bg-[#635BFF]/[0.02] transition-all text-center">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={e => setResumeFile(e.target.files[0])}
              />
              {resumeFile ? (
                <div className="flex items-center gap-2 text-sm text-[#635BFF] font-medium">
                  <FileCheck size={16} />
                  {resumeFile.name}
                </div>
              ) : user?.candidate?.resumeName ? (
                <div className="text-sm text-slate-500">
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 justify-center">
                    <BookmarkCheck size={13} /> Using: {user.candidate.resumeName}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Click to upload a different resume</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-600">Click to upload resume</p>
                  <p className="text-xs text-slate-400 mt-0.5">PDF, DOC, DOCX accepted</p>
                </div>
              )}
            </label>
            {!user?.candidate?.resumeUrl && !resumeFile && (
              <p className="mt-1.5 text-xs text-red-500">Please upload a resume to continue</p>
            )}
          </div>

          <Textarea
            label="Cover Letter (optional)"
            placeholder="Tell the employer why you're a great fit for this role..."
            rows={4}
            value={coverLetter}
            onChange={e => setCoverLetter(e.target.value)}
          />

          <div className="flex gap-3">
            <Button onClick={handleApply} loading={applying} className="flex-1" size="lg">
              Submit Application
            </Button>
            <Button variant="secondary" onClick={() => setApplyModal(false)} size="lg">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Missing import inside modal — adding it here
const FileCheck = ({ size, ...props }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <polyline points="9 15 11 17 15 13" />
  </svg>
);
