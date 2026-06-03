import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Users, TrendingUp, CheckCircle, ArrowRight, Plus, Eye } from 'lucide-react';
import { companyAPI, applicationAPI, jobsAPI } from '../../services/api';
import { Card, StatCard, Badge, Button, SkeletonCard, EmptyState } from '../../components/ui';
import { STATUS_CONFIG, formatRelativeDate } from '../../lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f97316', '#22c55e', '#ef4444'];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function CompanyDashboard() {
  const [stats, setStats] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      companyAPI.getStats(),
      applicationAPI.getCompanyApplications({ limit: 5 }),
    ]).then(([statsRes, appsRes]) => {
      setStats(statsRes.data);
      setRecentApps(appsRes.data.applications);
    }).finally(() => setLoading(false));
  }, []);

  const pieData = stats?.applicationsByStatus?.map(s => ({
    name: STATUS_CONFIG[s.status]?.label || s.status,
    value: s._count,
  })) || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Company Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your hiring pipeline</p>
        </div>
        <Link to="/company/jobs/new">
          <Button><Plus size={16} /> Post Job</Button>
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase}    label="Total Jobs"        value={stats?.totalJobs || 0}        color="primary" />
        <StatCard icon={Eye}          label="Active Jobs"       value={stats?.activeJobs || 0}        color="green" />
        <StatCard icon={Users}        label="Total Applicants"  value={stats?.totalApplications || 0} color="amber" />
        <StatCard icon={TrendingUp}   label="Hired"            value={stats?.applicationsByStatus?.find(s => s.status === 'JOINED')?._count || 0} color="primary" />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pipeline Chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="p-5">
            <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">Application Pipeline</h2>
            {loading ? (
              <div className="h-48 skeleton rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pieData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>

        {/* Pie Chart */}
        <motion.div variants={item}>
          <Card className="p-5">
            <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">Status Breakdown</h2>
            {loading ? (
              <div className="h-48 skeleton rounded-xl" />
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Recent Applications */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Recent Applications</h2>
          <Link to="/company/applications" className="text-sm text-primary-600 hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
        </div>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : recentApps.length === 0 ? (
          <Card className="p-8">
            <EmptyState icon={Users} title="No applications yet" description="Post a job to start receiving applications" />
          </Card>
        ) : (
          <Card>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentApps.map(app => {
                const cfg = STATUS_CONFIG[app.status] || {};
                return (
                  <Link key={app.id} to={`/company/applications/${app.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold text-sm shrink-0">
                      {app.candidate?.firstName?.[0]}{app.candidate?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {app.candidate?.firstName} {app.candidate?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{app.job?.title}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge className={cfg.color}>{cfg.label}</Badge>
                      <p className="text-xs text-gray-400 mt-1">{formatRelativeDate(app.appliedAt)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}
