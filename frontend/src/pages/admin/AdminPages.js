import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, Briefcase, FileText, Shield, ShieldOff, CheckCircle, XCircle, Trash2, Search } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Card, StatCard, Badge, Button, Skeleton } from '../../components/ui';
import { formatDate, cn } from '../../lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats().then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  const chartData = stats?.recentApplications?.map(s => ({
    name: s.status.replace(/_/g, ' '),
    value: s._count,
  })) || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl mx-auto">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform-wide overview and management</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}     label="Total Users"    value={stats?.users || 0}        color="primary" />
        <StatCard icon={Building2} label="Companies"      value={stats?.companies || 0}    color="amber" />
        <StatCard icon={Briefcase} label="Jobs Posted"    value={stats?.jobs || 0}         color="green" />
        <StatCard icon={FileText}  label="Applications"   value={stats?.applications || 0} color="primary" />
      </motion.div>

      <motion.div variants={item}>
        <Card className="p-5">
          <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">Applications by Status</h2>
          {loading ? (
            <div className="h-52 skeleton rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={45} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                <Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#grad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await adminAPI.getUsers({ search, role, page, limit: 20 });
    setUsers(data.users);
    setTotal(data.total);
    setLoading(false);
  }, [search, role, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleBlock = async (user) => {
    await adminAPI.blockUser(user.id, !user.isBlocked);
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u));
    toast.success(user.isBlocked ? 'User unblocked' : 'User blocked');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        <p className="text-gray-500 mt-1">{total} total users</p>
      </div>

      <Card className="p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search by email or name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-40" value={role} onChange={e => setRole(e.target.value)}>
          <option value="">All Roles</option>
          <option value="CANDIDATE">Candidate</option>
          <option value="COMPANY">Company</option>
          <option value="ADMIN">Admin</option>
        </select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
                  </tr>
                ))
              ) : users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user.candidate ? `${user.candidate.firstName} ${user.candidate.lastName}` : user.company?.name || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge className={user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : user.role === 'COMPANY' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={user.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                      {user.isBlocked ? 'Blocked' : 'Active'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleBlock(user)}
                      className={cn('p-1.5 rounded-lg transition-colors', user.isBlocked ? 'hover:bg-green-50 text-green-500' : 'hover:bg-red-50 text-red-400')}
                      title={user.isBlocked ? 'Unblock' : 'Block'}
                    >
                      {user.isBlocked ? <Shield size={16} /> : <ShieldOff size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={users.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    adminAPI.getCompanies({ search }).then(({ data }) => setCompanies(data.companies)).finally(() => setLoading(false));
  }, [search]);

  const verify = async (company) => {
    await adminAPI.verifyCompany(company.id, !company.isVerified);
    setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, isVerified: !c.isVerified } : c));
    toast.success(company.isVerified ? 'Verification removed' : 'Company verified');
  };

  const block = async (company) => {
    await adminAPI.blockCompany(company.id, !company.isBlocked);
    setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, isBlocked: !c.isBlocked } : c));
    toast.success(company.isBlocked ? 'Company unblocked' : 'Company blocked');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Companies</h1>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9 max-w-sm" placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Company', 'Industry', 'Jobs', 'Verified', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}</tr>
                ))
              ) : companies.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {c.logo ? <img src={c.logo} alt="" className="w-8 h-8 rounded-lg object-contain" /> : <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700" />}
                      <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.industry || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c._count?.jobs || 0}</td>
                  <td className="px-4 py-3">
                    <Badge className={c.isVerified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                      {c.isVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={c.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                      {c.isBlocked ? 'Blocked' : 'Active'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => verify(c)} className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg text-green-500" title={c.isVerified ? 'Remove verification' : 'Verify'}>
                        <CheckCircle size={15} />
                      </button>
                      <button onClick={() => block(c)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400" title={c.isBlocked ? 'Unblock' : 'Block'}>
                        {c.isBlocked ? <Shield size={15} /> : <ShieldOff size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAllJobs().then(({ data }) => setJobs(data.jobs)).finally(() => setLoading(false));
  }, []);

  const deleteJob = async (id) => {
    if (!window.confirm('Delete this job?')) return;
    await adminAPI.deleteJob(id);
    setJobs(prev => prev.filter(j => j.id !== id));
    toast.success('Job deleted');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Jobs</h1>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Job Title', 'Company', 'Type', 'Applications', 'Status', 'Posted', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}</tr>)
              ) : jobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{job.title}</td>
                  <td className="px-4 py-3 text-gray-500">{job.company?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{job.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-gray-500">{job._count?.applications || 0}</td>
                  <td className="px-4 py-3">
                    <Badge className={job.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>{job.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(job.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteJob(job.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export function AdminEmailLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getEmailLogs().then(({ data }) => setLogs(data.logs)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Logs</h1>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['To', 'Subject', 'Template', 'Status', 'Attempts', 'Sent At'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                [...Array(5)].map((_, i) => <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}</tr>)
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{log.to}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-48 truncate">{log.subject}</td>
                  <td className="px-4 py-3 text-gray-500">{log.template}</td>
                  <td className="px-4 py-3">
                    <Badge className={
                      log.status === 'SENT' ? 'bg-green-100 text-green-700' :
                      log.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }>{log.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{log.attempts}</td>
                  <td className="px-4 py-3 text-gray-500">{log.sentAt ? formatDate(log.sentAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
