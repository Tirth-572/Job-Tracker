import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkCheck, MapPin, Briefcase } from 'lucide-react';
import { candidateAPI } from '../../services/api';
import { Card, Badge, Button, EmptyState } from '../../components/ui';
import { JOB_TYPE_CONFIG, formatRelativeDate, getFileUrl } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function SavedJobs() {
 const [saved, setSaved] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 candidateAPI.getSavedJobs().then(({ data }) => setSaved(data)).finally(() => setLoading(false));
 }, []);

 const unsave = async (jobId) => {
 await candidateAPI.unsaveJob(jobId);
 setSaved(prev => prev.filter(s => s.jobId !== jobId));
 toast.success('Removed from saved');
 };

 return (
 <div className="max-w-4xl mx-auto space-y-5">
 <div>
 <h1 className="text-2xl font-bold text-gray-900 ">Saved Jobs</h1>
 <p className="text-gray-500 mt-1">{saved.length} saved jobs</p>
 </div>

 {loading ? (
 <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div>
 ) : saved.length === 0 ? (
 <Card className="p-12">
 <EmptyState icon={BookmarkCheck} title="No saved jobs" description="Browse jobs and save the ones you're interested in" action={<Link to="/candidate/jobs"><Button>Browse Jobs</Button></Link>} />
 </Card>
 ) : (
 <div className="space-y-3">
 {saved.map(({ job, jobId, createdAt }) => {
 const typeCfg = JOB_TYPE_CONFIG[job?.type] || {};
 return (
 <Card key={jobId} className="p-4 flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
 {job?.company?.logo
 ? <img src={getFileUrl(job.company.logo)} alt="" className="w-full h-full object-contain rounded-xl" />
 : <Briefcase size={18} className="text-gray-400" />
 }
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-semibold text-gray-900 ">{job?.title}</h3>
 <p className="text-sm text-gray-500">{job?.company?.name} · <span className="flex items-center gap-1 inline-flex"><MapPin size={12} />{job?.location}</span></p>
 <div className="flex gap-2 mt-1">
 <Badge className={typeCfg.color}>{typeCfg.label}</Badge>
 <span className="text-xs text-gray-400">Saved {formatRelativeDate(createdAt)}</span>
 </div>
 </div>
 <div className="flex gap-2 shrink-0">
  {job?.status === 'ACTIVE' ? (
    <Link to="/candidate/jobs" state={{ preselectedJobId: jobId }}><Button size="sm" className="bg-[#635BFF] hover:bg-[#5146E5] text-white">Apply</Button></Link>
  ) : (
    <Badge className="bg-red-50 text-red-600 border border-red-200">Closed</Badge>
  )}
  <Button variant="outline" size="sm" onClick={() => unsave(jobId)}>Remove</Button>
 </div>
 </Card>
 );
 })}
 </div>
 )}
 </div>
 );
}
