import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, BookmarkCheck, CheckCircle, Clock, Briefcase, ArrowRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { applicationAPI, jobsAPI } from '../../services/api';
import { Card, StatCard, Badge, SkeletonCard, EmptyState } from '../../components/ui';
import { STATUS_CONFIG, JOB_TYPE_CONFIG, formatRelativeDate, formatSalary } from '../../lib/utils';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      applicationAPI.getCandidateApplications({ limit: 5 }),
      jobsAPI.getJobs({ limit: 6 }),
    ]).then(([appRes, jobRes]) => {
      setApplications(appRes.data.applications);
      setRecentJobs(jobRes.data.jobs);
    }).finally(() => setLoading(false));
  }, []);

  const name = user?.candidate ? `${user.candidate.firstName}` : 'there';
  const stats = {
    total: applications.length,
    active: applications.filter(a => !['REJECTED', 'JOINED'].includes(a.status)).length,
    interviews: applications.filter(a => a.status === 'INTERVIEW_SCHEDULED').length,
    offers: applications.filter(a => ['OFFER_SENT', 'SELECTED'].includes(a.status)).length,
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Good morning, {name}! 👋</h1>
        <p className="text-gray-500 mt-1">Here's your job search overview</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText}    label="Total Applied"      value={stats.total}      color="primary" />
        <StatCard icon={TrendingUp}  label="Active Applications" value={stats.active}     color="amber" />
        <StatCard icon={Clock}       label="Interviews Scheduled" value={stats.interviews} color="primary" />
        <StatCard icon={CheckCircle} label="Offers Received"    value={stats.offers}      color="green" />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Applications */}
        <motion.div variants={item} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Applications</h2>
            <Link to="/candidate/applications" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : applications.length === 0 ? (
            <Card className="p-8">
              <EmptyState icon={FileText} title="No applications yet" description="Browse jobs and start applying!" action={
                <Link to="/candidate/jobs" className="btn-primary">Browse Jobs</Link>
              } />
            </Card>
          ) : (
            <div className="space-y-3">
              {applications.map(app => {
                const cfg = STATUS_CONFIG[app.status] || {};
                return (
                  <Link key={app.id} to={`/candidate/applications`}>
                    <Card className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                          {app.job?.company?.logo
                            ? <img src={app.job.company.logo} alt="" className="w-full h-full object-contain rounded-lg" />
                            : <Briefcase size={18} className="text-gray-400" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{app.job?.title}</p>
                          <p className="text-sm text-gray-500">{app.job?.company?.name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge className={cfg.color}>{cfg.label}</Badge>
                          <p className="text-xs text-gray-400 mt-1">{formatRelativeDate(app.appliedAt)}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Recommended Jobs */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recommended Jobs</h2>
            <Link to="/candidate/jobs" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {loading
              ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
              : recentJobs.slice(0, 4).map(job => {
                  const typeCfg = JOB_TYPE_CONFIG[job.type] || {};
                  return (
                    <Link key={job.id} to={`/candidate/jobs`}>
                      <Card className="p-3 hover:shadow-md transition-all cursor-pointer">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                            {job.company?.logo
                              ? <img src={job.company.logo} alt="" className="w-full h-full object-contain rounded-lg" />
                              : <Building2 size={14} className="text-gray-400" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{job.title}</p>
                            <p className="text-xs text-gray-500 truncate">{job.company?.name}</p>
                            <Badge className={`${typeCfg.color} mt-1`}>{typeCfg.label}</Badge>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })
            }
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function Building2({ size, className }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>;
}
