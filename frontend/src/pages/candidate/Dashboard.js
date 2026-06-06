import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FileText, CheckCircle, Clock, Briefcase, ArrowRight,
    TrendingUp, Building2, Sparkles, Target, BarChart2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { applicationAPI, jobsAPI, candidateAPI } from '../../services/api';
import { Card, StatCard, Badge, SkeletonCard, EmptyState, ProgressBar, Modal, Input, Select, Button } from '../../components/ui';
import { STATUS_CONFIG, JOB_TYPE_CONFIG, formatRelativeDate, formatSalary, getFileUrl, getGreeting } from '../../lib/utils';
import { INDUSTRIES } from '../auth/AuthPages';
import toast from 'react-hot-toast';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

export default function CandidateDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [recentJobs, setRecentJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingForm, setOnboardingForm] = useState({ jobTitle: '', industry: '', phone: '', location: '', dob: '', gender: '' });
    const [resumeFile, setResumeFile] = useState(null);
    const [savingOnboarding, setSavingOnboarding] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('candidateOnboarding') === 'true') {
            setShowOnboarding(true);
        }
        Promise.all([
            applicationAPI.getCandidateApplications({ limit: 5 }),
            jobsAPI.getJobs({ limit: 6 }),
        ]).then(([appRes, jobRes]) => {
            setApplications(appRes.data.applications);
            setRecentJobs(jobRes.data.jobs);
        }).finally(() => setLoading(false));
    }, []);

    const handleOnboardingSubmit = async () => {
        if (!onboardingForm.jobTitle || !onboardingForm.industry) {
            return toast.error("Please fill in your Job Title and Industry at least.");
        }
        setSavingOnboarding(true);
        try {
            await candidateAPI.updateProfile({ 
                jobTitle: onboardingForm.jobTitle, 
                industry: onboardingForm.industry,
                phone: onboardingForm.phone,
                location: onboardingForm.location,
                dob: onboardingForm.dob ? new Date(onboardingForm.dob).toISOString() : undefined,
                gender: onboardingForm.gender
            });
            if (resumeFile) {
                const fd = new FormData();
                fd.append('resume', resumeFile);
                await candidateAPI.uploadResume(fd);
            }
            toast.success("Profile setup complete!");
            localStorage.removeItem('candidateOnboarding');
            setShowOnboarding(false);
            window.location.reload();
        } catch (err) {
            toast.error("Failed to complete setup");
        } finally {
            setSavingOnboarding(false);
        }
    };

    const skipOnboarding = () => {
        localStorage.removeItem('candidateOnboarding');
        setShowOnboarding(false);
    };

    const name = user?.candidate?.firstName || 'there';
    const stats = {
        total: applications.length,
        active: applications.filter(a => !['REJECTED', 'JOINED'].includes(a.status)).length,
        interviews: applications.filter(a => a.status === 'INTERVIEW_SCHEDULED').length,
        offers: applications.filter(a => ['OFFER_SENT', 'SELECTED'].includes(a.status)).length,
    };

    const cand = user?.candidate;
    
    // Check Birthday
    const isBirthday = cand?.dob && (() => {
        const today = new Date();
        const dob = new Date(cand.dob);
        return today.getMonth() === dob.getMonth() && today.getDate() === dob.getDate();
    })();

    useEffect(() => {
        if (isBirthday && !sessionStorage.getItem('bday_wished')) {
            toast('🎉 Happy Birthday! Wishing you a fantastic day ahead!', { icon: '🎂', duration: 5000 });
            sessionStorage.setItem('bday_wished', 'true');
        }
    }, [isBirthday]);

    const profileFields = [
        { key: 'firstName', label: 'First Name', val: cand?.firstName },
        { key: 'lastName', label: 'Last Name', val: cand?.lastName },
        { key: 'phone', label: 'Phone', val: cand?.phone },
        { key: 'dob', label: 'Date of Birth', val: cand?.dob },
        { key: 'gender', label: 'Gender', val: cand?.gender },
        { key: 'avatar', label: 'Profile Picture', val: cand?.avatar },
        { key: 'resumeUrl', label: 'Resume', val: cand?.resumeUrl },
        { key: 'bio', label: 'Bio', val: cand?.bio },
        { key: 'location', label: 'Location', val: cand?.location },
        { key: 'industry', label: 'Industry', val: cand?.industry },
        { key: 'jobTitle', label: 'Job Title', val: cand?.jobTitle },
        { key: 'linkedinUrl', label: 'LinkedIn', val: cand?.linkedinUrl },
        { key: 'githubUrl', label: 'GitHub', val: cand?.githubUrl },
        { key: 'portfolioUrl', label: 'Portfolio', val: cand?.portfolioUrl },
        { key: 'skills', label: 'Skills', val: cand?.skills?.length > 0 ? true : null },
        { key: 'experience', label: 'Experience', val: cand?.experiences?.length > 0 ? true : null },
        { key: 'education', label: 'Education', val: cand?.educations?.length > 0 ? true : null },
    ];
    
    const missingFields = profileFields.filter(f => !f.val);
    const filledCount = profileFields.length - missingFields.length;
    const profilePct = Math.round((filledCount / profileFields.length) * 100);

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Birthday Banner */}
            {isBirthday && (
                <motion.div variants={item} className="bg-gradient-to-r from-amber-200 to-yellow-400 rounded-2xl p-6 shadow-soft flex items-center justify-between border border-yellow-300">
                    <div>
                        <h2 className="text-xl font-bold text-yellow-900 flex items-center gap-2">
                            <Sparkles size={20} className="text-yellow-700" /> Happy Birthday, {name}! 🎂
                        </h2>
                        <p className="text-yellow-800 font-medium mt-1">We hope you have an amazing day filled with joy. Best wishes from the HireBridge team!</p>
                    </div>
                </motion.div>
            )}

            {/* Banner */}
            <motion.div variants={item}>
                <div className="relative rounded-2xl p-8 overflow-hidden shadow-card-hover"
                    style={{ background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)' }}>
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/3 pointer-events-none backdrop-blur-sm" />
                    <div className="relative z-10 flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{getGreeting()}, {name}! 👋</h1>
                            <p className="text-gray-800 text-sm mt-1 font-medium">
                                {stats.active > 0 ? `${stats.active} active application${stats.active !== 1 ? 's' : ''} in progress` : 'Ready to find your next opportunity?'}
                            </p>
                        </div>
                        <Link to="/candidate/jobs"
                            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-brand-surface text-brand-primary font-bold text-sm rounded-2xl hover:bg-white transition-all duration-300 shrink-0 shadow-soft">
                            <Sparkles size={16} /> Browse Jobs
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard icon={FileText} label="Total Applied" value={stats.total} color="brand" />
                <StatCard icon={TrendingUp} label="Active" value={stats.active} color="cyan" />
                <StatCard icon={Clock} label="Interviews" value={stats.interviews} color="amber" />
                <StatCard icon={CheckCircle} label="Offers" value={stats.offers} color="green" />
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Applications */}
                <motion.div variants={item} className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="section-title"><Target size={18} className="text-brand-primary" /> Recent Applications</h2>
                        <Link to="/candidate/applications" className="flex items-center gap-1 text-sm font-bold text-brand-primary hover:text-brand-secondary transition-colors">
                            View all <ArrowRight size={14} />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="space-y-4">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
                    ) : applications.length === 0 ? (
                        <Card className="p-10">
                            <EmptyState icon={FileText} title="No applications yet" description="Start applying to jobs and track your progress here."
                                action={<Link to="/candidate/jobs" className="btn-primary"><Briefcase size={16} /> Browse Jobs</Link>} />
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {applications.map((app, idx) => {
                                const cfg = STATUS_CONFIG[app.status] || {};
                                return (
                                    <motion.div key={app.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                                        <Link to="/candidate/applications">
                                            <Card className="p-5 group cursor-pointer border border-transparent hover:border-brand-primary/20">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center shrink-0 border border-brand-primary/20 overflow-hidden">
                                                        {app.job?.company?.logo
                                                            ? <img src={getFileUrl(app.job.company.logo)} alt="" className="w-full h-full object-contain" />
                                                            : <Briefcase size={20} className="text-brand-primary" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-base text-gray-900 truncate group-hover:text-brand-primary transition-colors">
                                                            {app.job?.title}
                                                        </p>
                                                        <p className="text-sm text-gray-500 truncate flex items-center gap-1.5 mt-1 font-medium">
                                                            <Building2 size={14} /> {app.job?.company?.name}
                                                        </p>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <Badge className={cfg.color} dot>{cfg.label}</Badge>
                                                        <p className="text-xs font-medium text-gray-400 mt-2">{formatRelativeDate(app.appliedAt)}</p>
                                                    </div>
                                                </div>
                                            </Card>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Right column */}
                <div className="space-y-6">
                    {/* Profile strength */}
                    <motion.div variants={item}>
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="section-title text-sm">Profile Strength</h3>
                                <span className="text-sm font-bold text-brand-primary">{profilePct}%</span>
                            </div>
                            <ProgressBar value={profilePct} max={100} color="brand" className="mb-4" />
                            {profilePct < 100 && missingFields.length > 0 ? (
                                <div className="mt-3">
                                    <p className="text-xs text-gray-500 font-medium mb-2">Complete these to reach 100%:</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {missingFields.slice(0, 3).map(f => (
                                            <Badge 
                                                key={f.key} 
                                                onClick={() => navigate('/candidate/profile', { state: { openModal: f.key } })}
                                                className="bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors cursor-pointer"
                                            >
                                                {f.label}
                                            </Badge>
                                        ))}
                                        {missingFields.length > 3 && <Badge className="bg-gray-100 text-gray-600">+{missingFields.length - 3} more</Badge>}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-green-600 leading-relaxed font-medium mt-3 flex items-center gap-1">
                                    <CheckCircle size={14} /> Great job! Your profile is complete.
                                </p>
                            )}
                            <Link to="/candidate/profile" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-primary hover:text-brand-secondary mt-4 transition-colors">
                                Update profile <ArrowRight size={14} />
                            </Link>
                        </Card>
                    </motion.div>

                    {/* Recommended */}
                    <motion.div variants={item}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="section-title"><BarChart2 size={18} className="text-brand-primary" /> Recommended</h2>
                            <Link to="/candidate/jobs" className="text-sm font-bold text-brand-primary hover:text-brand-secondary transition-colors">View all</Link>
                        </div>
                        <div className="space-y-3">
                            {loading ? [...Array(3)].map((_, i) => <SkeletonCard key={i} />) :
                                recentJobs.slice(0, 4).map((job, idx) => {
                                    const typeCfg = JOB_TYPE_CONFIG[job.type] || {};
                                    return (
                                        <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
                                            <Link to="/candidate/jobs">
                                                <Card className="p-4 group cursor-pointer border border-transparent hover:border-brand-primary/20">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center shrink-0 border border-brand-primary/20 overflow-hidden">
                                                            {job.company?.logo
                                                                ? <img src={getFileUrl(job.company.logo)} alt="" className="w-full h-full object-contain" />
                                                                : <Building2 size={16} className="text-brand-primary" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-gray-900 truncate group-hover:text-brand-primary transition-colors leading-tight">{job.title}</p>
                                                            <p className="text-xs font-medium text-gray-500 truncate mt-1">{job.company?.name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <Badge className={typeCfg.color}>{typeCfg.label}</Badge>
                                                        {(job.salaryMin || job.salaryMax) && (
                                                            <span className="text-xs font-medium text-gray-400">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                                                        )}
                                                    </div>
                                                </Card>
                                            </Link>
                                        </motion.div>
                                    );
                                })
                            }
                        </div>
                    </motion.div>
                </div>
            </div>

            <Modal isOpen={showOnboarding} onClose={skipOnboarding} title="Welcome to HireBridge! Let's get you set up." size="lg">
                <div className="space-y-4">
                    <p className="text-gray-600 text-sm">To give you the best job recommendations, please complete your profile details.</p>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Job Title" placeholder="e.g. Frontend Developer" value={onboardingForm.jobTitle || ''} onChange={e => setOnboardingForm(p => ({...p, jobTitle: e.target.value}))} />
                        <Select label="Industry" value={onboardingForm.industry || ''} onChange={e => setOnboardingForm(p => ({...p, industry: e.target.value}))}>
                            <option value="">Select Industry</option>
                            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Phone Number" placeholder="e.g. +1 234 567 8900" value={onboardingForm.phone || ''} onChange={e => setOnboardingForm(p => ({...p, phone: e.target.value}))} />
                        <Input label="Location" placeholder="e.g. New York, USA" value={onboardingForm.location || ''} onChange={e => setOnboardingForm(p => ({...p, location: e.target.value}))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="Date of Birth" type="date" value={onboardingForm.dob || ''} onChange={e => setOnboardingForm(p => ({...p, dob: e.target.value}))} />
                        <Select label="Gender" value={onboardingForm.gender || ''} onChange={e => setOnboardingForm(p => ({...p, gender: e.target.value}))}>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </Select>
                    </div>
                    <div>
                        <label className="label">Resume (Optional)</label>
                        <input type="file" className="input mt-1" accept=".pdf,.doc,.docx" onChange={e => setResumeFile(e.target.files[0])} />
                        <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 10MB.</p>
                    </div>
                    <div className="flex gap-3 pt-3">
                        <Button onClick={handleOnboardingSubmit} loading={savingOnboarding} className="flex-1">Complete Setup</Button>
                        <Button variant="secondary" onClick={skipOnboarding}>Skip for now</Button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
}
