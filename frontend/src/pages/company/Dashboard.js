import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Users, TrendingUp, Eye, ArrowRight, Plus, BarChart3, Inbox, ChevronRight, Sparkles } from 'lucide-react';
import { companyAPI, applicationAPI } from '../../services/api';
import { Card, StatCard, Badge, Button, SkeletonCard, EmptyState, Modal, Avatar } from '../../components/ui';
import { STATUS_CONFIG, formatRelativeDate, getGreeting, getFileUrl } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StickyNotesBoard from '../../components/shared/StickyNotesBoard';
import toast from 'react-hot-toast';

const COLORS = ['#71C9CE', '#A6E3E9', '#4A9699', '#F59E0B', '#8B5CF6', '#F97316', '#10B981', '#EF4444'];
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) return (
        <div className="bg-[#E3FDFD] border border-[#B8E8EC] rounded-xl px-3 py-2 shadow-lg text-xs">
            <p className="font-semibold text-[#1F2937] mb-0.5">{label}</p>
            <p className="text-[#71C9CE]">{payload[0].value} applications</p>
        </div>
    );
    return null;
};

export default function CompanyDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentApps, setRecentApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);

    // Check Anniversary
    const comp = user?.company;
    const isAnniversary = comp?.createdAt && (() => {
        const today = new Date();
        const created = new Date(comp.createdAt);
        return today.getMonth() === created.getMonth() && 
               today.getDate() === created.getDate() && 
               today.getFullYear() > created.getFullYear();
    })();
    const anniversaryYears = comp?.createdAt ? new Date().getFullYear() - new Date(comp.createdAt).getFullYear() : 0;

    useEffect(() => {
        if (isAnniversary && !sessionStorage.getItem('anniversary_wished')) {
            toast(`🎉 Happy ${anniversaryYears} Year Anniversary with HireBridge!`, { icon: '🏢', duration: 5000 });
            sessionStorage.setItem('anniversary_wished', 'true');
        }
    }, [isAnniversary, anniversaryYears]);

    useEffect(() => {
        Promise.all([companyAPI.getStats(), applicationAPI.getCompanyApplications({ limit: 6 })])
            .then(([s, a]) => { setStats(s.data); setRecentApps(a.data.applications); })
            .finally(() => setLoading(false));
    }, []);

    const pieData = stats?.applicationsByStatus?.map(s => ({
        name: STATUS_CONFIG[s.status]?.label || s.status,
        value: s._count,
    })) || [];

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Anniversary Banner */}
            {isAnniversary && (
                <motion.div variants={item} className="bg-gradient-to-r from-[#71C9CE]/20 to-[#A6E3E9]/30 rounded-2xl p-6 shadow-soft flex items-center justify-between border border-[#71C9CE]/30">
                    <div>
                        <h2 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
                            <Sparkles size={20} className="text-[#4A9699]" /> Happy {anniversaryYears} Year Anniversary! 🏢
                        </h2>
                        <p className="text-[#4A9699] font-medium mt-1">Thank you for trusting HireBridge with your hiring needs. Here's to many more successful years together!</p>
                    </div>
                </motion.div>
            )}

            {/* Banner */}
            <motion.div variants={item}>
                <div className="relative rounded-2xl p-6 overflow-hidden bg-[#1F2937]">
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#71C9CE]/8 -translate-y-1/2 translate-x-1/3 pointer-events-none blur-2xl" />
                    <div className="relative z-10 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[#9CA3AF] text-xs font-medium uppercase tracking-wider mb-1">{getGreeting()}</p>
                            <h1 className="text-xl font-bold text-white">{user?.company?.name || 'Company'}</h1>
                            <p className="text-[#9CA3AF] text-sm mt-1">
                                {stats ? `${stats.activeJobs || 0} active job${(stats.activeJobs || 0) !== 1 ? 's' : ''} · ${recentApps.length} recent applications` : 'Loading your overview…'}
                            </p>
                        </div>
                        <Link to="/company/jobs" state={{ openCreate: true }}>
                            <Button className="shrink-0">
                                <Plus size={16} /> Post Job
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Briefcase} label="Total Jobs" value={stats?.totalJobs || 0} color="brand" />
                <StatCard icon={Eye} label="Active" value={stats?.activeJobs || 0} color="green" />
                <StatCard icon={TrendingUp} label="Closed" value={stats?.closedJobs || 0} color="cyan" />
                <StatCard icon={Users} label="Expired" value={stats?.expiredJobs || 0} color="amber" />
            </motion.div>

            {/* Charts */}
            <div className="grid lg:grid-cols-5 gap-5">
                <motion.div variants={item} className="lg:col-span-3">
                    <Card className="p-5">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="section-title"><BarChart3 size={16} className="text-[#71C9CE]" /> Application Pipeline</h2>
                            <Link to="/company/applications" className="text-xs font-semibold text-[#71C9CE] hover:underline flex items-center gap-1">
                                View all <ChevronRight size={13} />
                            </Link>
                        </div>
                        {loading ? <div className="h-52 skeleton rounded-xl" /> : pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={pieData} margin={{ top: 4, right: 4, left: -24, bottom: 40 }}>
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} angle={-25} textAnchor="end" interval={0} />
                                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-52 flex items-center justify-center text-[#9CA3AF] text-sm">No applications yet</div>
                        )}
                    </Card>
                </motion.div>

                <motion.div variants={item} className="lg:col-span-2">
                    <Card className="p-5 h-full">
                        <h2 className="section-title mb-4"><TrendingUp size={16} className="text-[#71C9CE]" /> Status Breakdown</h2>
                        {loading ? <div className="h-52 skeleton rounded-xl" /> : pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="45%" innerRadius={48} outerRadius={76} dataKey="value" paddingAngle={2}>
                                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid #B8E8EC', background: '#E3FDFD' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-52 flex items-center justify-center text-[#9CA3AF] text-sm">No data yet</div>
                        )}
                    </Card>
                </motion.div>
            </div>

            {/* Sticky Notes */}
            <motion.div variants={item}>
                <StickyNotesBoard />
            </motion.div>

            {/* Recent Applications */}
            <motion.div variants={item}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="section-title"><Inbox size={16} className="text-[#71C9CE]" /> Recent Applications</h2>
                    <Link to="/company/applications" className="flex items-center gap-1 text-xs font-semibold text-[#71C9CE] hover:text-[#4A9699] transition-colors">
                        View all <ArrowRight size={13} />
                    </Link>
                </div>
                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
                ) : recentApps.length === 0 ? (
                    <Card className="p-8">
                        <EmptyState icon={Users} title="No applications yet" description="Post a job to start receiving applications from candidates."
                            action={<Link to="/company/jobs" state={{ openCreate: true }} className="btn-primary text-sm"><Plus size={15} /> Post a Job</Link>} />
                    </Card>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {recentApps.map((app, idx) => {
                            const cfg = STATUS_CONFIG[app.status] || {};
                            return (
                                <motion.div key={app.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
                                    <button onClick={() => setSelectedApp(app)} className="w-full text-left">
                                        <Card className="p-4 group">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Avatar name={`${app.candidate?.firstName} ${app.candidate?.lastName}`} src={getFileUrl(app.candidate?.avatar)} size="sm" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-[#1F2937] truncate group-hover:text-[#71C9CE] transition-colors">
                                                        {app.candidate?.firstName} {app.candidate?.lastName}
                                                    </p>
                                                    <p className="text-xs text-[#9CA3AF] truncate">{app.job?.title}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Badge className={cfg.color} dot>{cfg.label}</Badge>
                                                <span className="text-[11px] text-[#9CA3AF]">{formatRelativeDate(app.appliedAt)}</span>
                                            </div>
                                        </Card>
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            <Modal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} title="Application Details" size="lg">
                {selectedApp && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-[#CBF1F5] rounded-xl border border-[#B8E8EC]">
                            <Avatar name={`${selectedApp.candidate?.firstName} ${selectedApp.candidate?.lastName}`} src={getFileUrl(selectedApp.candidate?.avatar)} size="lg" />
                            <div>
                                <h3 className="font-bold text-[#1F2937]">{selectedApp.candidate?.firstName} {selectedApp.candidate?.lastName}</h3>
                                <p className="text-sm text-[#6B7280]">{selectedApp.candidate?.user?.email || 'Candidate'}</p>
                                <Badge className={(STATUS_CONFIG[selectedApp.status]?.color || 'bg-[#CBF1F5] text-[#357B7E]') + ' mt-1.5'} dot>
                                    {STATUS_CONFIG[selectedApp.status]?.label || selectedApp.status}
                                </Badge>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-[#CBF1F5] rounded-xl border border-[#B8E8EC]">
                                <p className="text-xs text-[#9CA3AF] mb-0.5">Applied for</p>
                                <p className="font-semibold text-sm text-[#1F2937]">{selectedApp.job?.title}</p>
                            </div>
                            <div className="p-3 bg-[#CBF1F5] rounded-xl border border-[#B8E8EC]">
                                <p className="text-xs text-[#9CA3AF] mb-0.5">Applied</p>
                                <p className="font-semibold text-sm text-[#1F2937]">{formatRelativeDate(selectedApp.appliedAt)}</p>
                            </div>
                        </div>
                        {(selectedApp.resumeUrl || selectedApp.candidate?.resumeUrl) && (
                            <div>
                                <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Resume</p>
                                <iframe src={getFileUrl(selectedApp.resumeUrl || selectedApp.candidate?.resumeUrl)} className="w-full h-80 border border-[#B8E8EC] rounded-xl" title="Resume PDF" />
                                <div className="mt-2 text-right">
                                    <a href={getFileUrl(selectedApp.resumeUrl || selectedApp.candidate?.resumeUrl)} target="_blank" rel="noopener noreferrer" className="text-xs text-[#71C9CE] hover:underline font-medium">Open in new tab ↗</a>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3 pt-3 border-t border-[#B8E8EC]">
                            <Link to="/company/applications" className="flex-1"><Button className="w-full">Manage Applications</Button></Link>
                            <Button variant="white" onClick={() => setSelectedApp(null)}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </motion.div>
    );
}
