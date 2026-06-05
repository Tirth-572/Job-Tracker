import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Globe, Users, Briefcase, Mail, Phone, Building2, ChevronLeft } from 'lucide-react';
import { companyAPI } from '../../services/api';
import { Card, Badge, Avatar } from '../../components/ui';
import { getFileUrl, JOB_TYPE_CONFIG, formatRelativeDate, formatSalary } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function CompanyProfileView() {
 const { id } = useParams();
 const navigate = useNavigate();
 const [company, setCompany] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 setLoading(true);
 companyAPI.getPublicProfile(id)
 .then(({ data }) => setCompany(data))
 .catch(err => toast.error(err.response?.data?.message || 'Failed to load company profile'))
 .finally(() => setLoading(false));
 }, [id]);

 if (loading) {
 return (
 <div className="max-w-4xl mx-auto space-y-5 animate-pulse">
 <div className="h-40 bg-gray-200 rounded-xl" />
 <div className="h-64 bg-gray-200 rounded-xl" />
 </div>
 );
 }

 if (!company) {
 return (
 <div className="max-w-4xl mx-auto text-center py-20">
 <h2 className="text-2xl font-bold text-gray-900 ">Company not found</h2>
 <Link to="/candidate/jobs" className="text-primary-600 hover:underline mt-4 inline-block">Back to jobs</Link>
 </div>
 );
 }

 return (
 <div className="max-w-4xl mx-auto space-y-6">
 <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 :text-white transition-colors">
 <ChevronLeft size={16} /> Back
 </button>

 {/* Header Card */}
 <Card className="p-8 relative overflow-hidden">
 <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
 <Building2 size={200} />
 </div>
 
 <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
 <Avatar src={getFileUrl(company.logo)} name={company.name} size="xl" className="w-24 h-24 rounded-2xl shadow-sm bg-white" />
 <div className="flex-1 min-w-0">
 <h1 className="text-3xl font-bold text-gray-900 ">{company.name}</h1>
 {company.industry && <p className="text-lg text-gray-600 mt-1">{company.industry}</p>}
 
 <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
 {company.location && <span className="flex items-center gap-1.5"><MapPin size={16} /> {company.location}</span>}
 {company.size && <span className="flex items-center gap-1.5"><Users size={16} /> {company.size} employees</span>}
 {company.website && (
 <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary-600 hover:underline">
 <Globe size={16} /> Website
 </a>
 )}
 </div>

 <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
 {company.user?.email && <span className="flex items-center gap-1.5"><Mail size={16} /> {company.user.email}</span>}
 {company.user?.phone && <span className="flex items-center gap-1.5"><Phone size={16} /> {company.user.phone}</span>}
 </div>
 </div>
 </div>

 {company.description && (
 <div className="mt-8 pt-8 border-t border-gray-100 ">
 <h3 className="font-semibold text-gray-900 mb-3">About {company.name}</h3>
 <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{company.description}</p>
 </div>
 )}
 </Card>

 {/* Active Jobs */}
 <div>
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-xl font-bold text-gray-900 ">Open Positions</h2>
 <Badge className="bg-primary-100 text-primary-700">{company._count?.jobs || 0}</Badge>
 </div>

 {company.jobs?.length === 0 ? (
 <Card className="p-8 text-center text-gray-500">
 No open positions currently available.
 </Card>
 ) : (
 <div className="grid gap-4">
 {company.jobs?.map((job, idx) => {
 const typeCfg = JOB_TYPE_CONFIG[job.type] || {};
 return (
 <motion.div key={job.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
 <Card className="p-5 flex flex-col md:flex-row gap-4 justify-between group hover:border-primary-200 transition-colors">
 <div className="flex-1 min-w-0">
 <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{job.title}</h3>
 <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-2">
 <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
 {(job.salaryMin || job.salaryMax) && (
 <span className="flex items-center gap-1"><Badge className="bg-green-50 text-green-700 ">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</Badge></span>
 )}
 <span className="text-xs text-gray-400">Posted {formatRelativeDate(job.createdAt)}</span>
 </div>
 
 {job.skills?.length > 0 && (
 <div className="flex flex-wrap gap-2 mt-3">
 {job.skills.slice(0, 4).map(s => <Badge key={s} className="bg-gray-100 text-gray-600 ">{s}</Badge>)}
 {job.skills.length > 4 && <span className="text-xs text-gray-400 pt-1">+{job.skills.length - 4} more</span>}
 </div>
 )}
 </div>
 <div className="shrink-0 flex items-center md:items-end md:flex-col justify-between gap-3">
 <Badge className={typeCfg.color}>{typeCfg.label}</Badge>
 <Link to="/candidate/jobs" state={{ preselectedJobId: job.id }} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors text-center block">
 Apply Now
 </Link>
 </div>
 </Card>
 </motion.div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 );
}
