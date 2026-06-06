import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, Briefcase, FileText, Shield, ShieldOff, CheckCircle, XCircle, Trash2, Search } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Card, StatCard, Badge, Button, SkeletonCard } from '../../components/ui';
import { formatDate, cn, getFileUrl, getGreeting } from '../../lib/utils';
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
 <motion.div variants={item} className="page-header mb-0">
 <h1 className="page-title">{getGreeting()}, Admin! 👋</h1>
 <p className="page-subtitle">Platform-wide overview and management</p>
 </motion.div>

 <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
 <StatCard icon={Users} label="Total Users" value={stats?.users || 0} color="brand" />
 <StatCard icon={Building2} label="Companies" value={stats?.companies || 0} color="cyan" />
 <StatCard icon={Briefcase} label="Jobs Posted" value={stats?.jobs || 0} color="green" />
 <StatCard icon={FileText} label="Applications" value={stats?.applications || 0} color="brand" />
 </motion.div>

 <motion.div variants={item}>
 <Card className="p-6">
 <h2 className="text-lg font-bold mb-6 text-gray-900">Applications by Status</h2>
 {loading ? (
 <div className="h-64 skeleton rounded-2xl" />
 ) : (
 <ResponsiveContainer width="100%" height={250}>
 <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
 <defs>
 <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#71C9CE" stopOpacity={0.4} />
 <stop offset="95%" stopColor="#71C9CE" stopOpacity={0} />
 </linearGradient>
 </defs>
 <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }} angle={-20} textAnchor="end" height={45} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
 <YAxis tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 600 }} tickLine={false} axisLine={false} />
 <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '13px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
 <Area type="monotone" dataKey="value" stroke="#71C9CE" fill="url(#grad)" strokeWidth={3} />
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
 <div className="max-w-7xl mx-auto space-y-6">
 <div className="page-header mb-0">
 <h1 className="page-title">Users</h1>
 <p className="page-subtitle">{total} total users</p>
 </div>

 <Card className="p-5 flex gap-4 flex-wrap">
 <div className="relative flex-1 min-w-48">
 <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input className="input pl-10" placeholder="Search by email or name..." value={search} onChange={e => setSearch(e.target.value)} />
 </div>
 <select className="input w-48" value={role} onChange={e => setRole(e.target.value)}>
 <option value="">All Roles</option>
 <option value="CANDIDATE">Candidate</option>
 <option value="COMPANY">Company</option>
 <option value="ADMIN">Admin</option>
 </select>
 </Card>

 <Card className="overflow-hidden border border-brand-primary/10">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-brand-surface border-b border-brand-primary/20">
 <tr>
 {['User', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
 <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-brand-primary/10">
 {loading ? (
 [...Array(5)].map((_, i) => (
 <tr key={i}>
 {[...Array(6)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-5 skeleton rounded" /></td>)}
 </tr>
 ))
 ) : users.map(user => (
 <tr key={user.id} className="hover:bg-brand-bg transition-colors">
 <td className="px-5 py-4">
 <p className="font-bold text-gray-900 ">
 {user.candidate ? `${user.candidate.firstName} ${user.candidate.lastName}` : user.company?.name || '—'}
 </p>
 </td>
 <td className="px-5 py-4 font-medium text-gray-500">{user.email}</td>
 <td className="px-5 py-4">
 <Badge className={user.role === 'ADMIN' ? 'bg-brand-bg text-brand-primary border-brand-primary/20' : user.role === 'COMPANY' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}>
 {user.role}
 </Badge>
 </td>
 <td className="px-5 py-4">
 <Badge className={user.isBlocked ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}>
 {user.isBlocked ? 'Blocked' : 'Active'}
 </Badge>
 </td>
 <td className="px-5 py-4 font-medium text-gray-500">{formatDate(user.createdAt)}</td>
 <td className="px-5 py-4">
 <button
 onClick={() => toggleBlock(user)}
 className={cn('p-2 rounded-xl transition-all border', user.isBlocked ? 'hover:bg-green-50 text-green-500 border-green-200' : 'hover:bg-red-50 text-red-400 border-red-200')}
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
 <div className="flex justify-center gap-3 p-5 border-t border-brand-primary/10 bg-brand-surface">
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
 <div className="max-w-7xl mx-auto space-y-6">
 <div className="page-header mb-0">
 <h1 className="page-title">Companies</h1>
 </div>

 <Card className="p-5">
 <div className="relative">
 <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
 <input className="input pl-10 max-w-md" placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} />
 </div>
 </Card>

 <Card className="overflow-hidden border border-brand-primary/10">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-brand-surface border-b border-brand-primary/20">
 <tr>
 {['Company', 'Industry', 'Jobs', 'Verified', 'Status', 'Actions'].map(h => (
 <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-brand-primary/10">
 {loading ? (
 [...Array(5)].map((_, i) => (
 <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-5 skeleton rounded" /></td>)}</tr>
 ))
 ) : companies.map(c => (
 <tr key={c.id} className="hover:bg-brand-bg transition-colors">
 <td className="px-5 py-4">
 <div className="flex items-center gap-3">
 {c.logo ? <img src={getFileUrl(c.logo)} alt="" className="w-10 h-10 rounded-xl object-contain border border-brand-primary/20 p-1 bg-white" /> : <div className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-primary/20" />}
 <span className="font-bold text-gray-900 ">{c.name}</span>
 </div>
 </td>
 <td className="px-5 py-4 font-medium text-gray-500">{c.industry || '—'}</td>
 <td className="px-5 py-4 font-medium text-gray-500">{c._count?.jobs || 0}</td>
 <td className="px-5 py-4">
 <Badge className={c.isVerified ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}>
 {c.isVerified ? 'Verified' : 'Unverified'}
 </Badge>
 </td>
 <td className="px-5 py-4">
 <Badge className={c.isBlocked ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}>
 {c.isBlocked ? 'Blocked' : 'Active'}
 </Badge>
 </td>
 <td className="px-5 py-4">
 <div className="flex gap-2">
 <button onClick={() => verify(c)} className="p-2 hover:bg-green-50 border border-transparent hover:border-green-200 rounded-xl text-green-500 transition-all" title={c.isVerified ? 'Remove verification' : 'Verify'}>
 <CheckCircle size={16} />
 </button>
 <button onClick={() => block(c)} className="p-2 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl text-red-400 transition-all" title={c.isBlocked ? 'Unblock' : 'Block'}>
 {c.isBlocked ? <Shield size={16} /> : <ShieldOff size={16} />}
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
 <div className="max-w-7xl mx-auto space-y-6">
 <div className="page-header mb-0">
 <h1 className="page-title">All Jobs</h1>
 </div>
 <Card className="overflow-hidden border border-brand-primary/10">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-brand-surface border-b border-brand-primary/20">
 <tr>
 {['Job Title', 'Company', 'Type', 'Applications', 'Status', 'Posted', 'Actions'].map(h => (
 <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-brand-primary/10">
 {loading ? (
 [...Array(5)].map((_, i) => <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-5 skeleton rounded" /></td>)}</tr>)
 ) : jobs.map(job => (
 <tr key={job.id} className="hover:bg-brand-bg transition-colors">
 <td className="px-5 py-4 font-bold text-gray-900 ">{job.title}</td>
 <td className="px-5 py-4 font-medium text-gray-500">{job.company?.name}</td>
 <td className="px-5 py-4 font-medium text-gray-500">{job.type.replace('_', ' ')}</td>
 <td className="px-5 py-4 font-medium text-gray-500">{job._count?.applications || 0}</td>
 <td className="px-5 py-4">
 <Badge className={job.status === 'ACTIVE' ? 'bg-brand-surface text-brand-primary border border-brand-primary/20' : 'bg-gray-100 text-gray-500'}>{job.status}</Badge>
 </td>
 <td className="px-5 py-4 font-medium text-gray-500">{formatDate(job.createdAt)}</td>
 <td className="px-5 py-4">
 <button onClick={() => deleteJob(job.id)} className="p-2 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl text-red-400 transition-all">
 <Trash2 size={16} />
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
 <div className="max-w-7xl mx-auto space-y-6">
 <div className="page-header mb-0">
 <h1 className="page-title">Email Logs</h1>
 </div>
 <Card className="overflow-hidden border border-brand-primary/10">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-brand-surface border-b border-brand-primary/20">
 <tr>
 {['To', 'Subject', 'Template', 'Status', 'Attempts', 'Sent At'].map(h => (
 <th key={h} className="text-left px-5 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-brand-primary/10">
 {loading ? (
 [...Array(5)].map((_, i) => <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-5 skeleton rounded" /></td>)}</tr>)
 ) : logs.map(log => (
 <tr key={log.id} className="hover:bg-brand-bg transition-colors">
 <td className="px-5 py-4 font-medium text-gray-700 ">{log.to}</td>
 <td className="px-5 py-4 font-medium text-gray-500 max-w-48 truncate">{log.subject}</td>
 <td className="px-5 py-4 font-medium text-gray-500">{log.template}</td>
 <td className="px-5 py-4">
 <Badge className={
 log.status === 'SENT' ? 'bg-green-50 text-green-600' :
 log.status === 'FAILED' ? 'bg-red-50 text-red-500' :
 'bg-amber-50 text-amber-600'
 }>{log.status}</Badge>
 </td>
 <td className="px-5 py-4 font-medium text-gray-500">{log.attempts}</td>
 <td className="px-5 py-4 font-medium text-gray-500">{log.sentAt ? formatDate(log.sentAt) : '—'}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </Card>
 </div>
 );
}
