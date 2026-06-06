import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Briefcase, Calendar, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { applicationAPI } from '../../services/api';
import { Card, Badge, Button, SkeletonCard, EmptyState } from '../../components/ui';
import { formatDate, formatRelativeDate, cn, getFileUrl } from '../../lib/utils';

const DynamicTimeline = ({ stages, currentStageId, isRejected }) => {
  const timelineStages = stages.filter(s => s.systemType !== 'REJECTED');
  const currentStage = timelineStages.find(s => s.id === currentStageId) || timelineStages.find(s => s.systemType === 'APPLIED') || timelineStages[0];
  const currentIdx = currentStage ? timelineStages.findIndex(s => s.id === currentStage.id) : 0;

  return (
    <div className="mt-5 mb-2">
      {isRejected ? (
        <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl border border-gray-200">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-500" />
          <span className="text-sm font-bold text-gray-700">Application Closed</span>
        </div>
      ) : (
        <div className="flex items-center gap-0 overflow-x-auto pb-12 pt-2 px-2 scrollbar-hide">
          {timelineStages.map((stage, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;

            return (
              <React.Fragment key={stage.id}>
                <div className="flex flex-col items-center shrink-0 relative">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 z-10',
                    active ? 'bg-brand-primary text-white ring-4 ring-brand-secondary/40 shadow-soft scale-110' :
                    done ? 'bg-brand-primary text-white' : 'bg-brand-bg text-gray-400 border border-brand-primary/20'
                  )}>
                    {done ? '✓' : idx + 1}
                  </div>
                  <p className={cn(
                    'absolute top-10 text-[11px] text-center w-24 leading-tight hidden sm:block',
                    active ? 'text-brand-primary font-bold' : done ? 'text-gray-700 font-medium' : 'text-gray-400'
                  )}>
                    {stage.name}
                  </p>
                </div>
                {idx < timelineStages.length - 1 && (
                  <div className={cn(
                    'flex-1 h-[2px] min-w-[40px] mx-1 transition-all rounded-full',
                    idx < currentIdx ? 'bg-brand-primary' : 'bg-brand-primary/10'
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ApplicationCard = ({ application }) => {
 const [expanded, setExpanded] = useState(false);
 const nextInterview = application.interviews?.find(i => new Date(i.scheduledAt) > new Date());
 
 const stages = application.job?.company?.workflowStages || [];
 const currentStage = application.stage || stages.find(s => s.systemType === 'APPLIED');
 const isRejected = application.status === 'REJECTED' || currentStage?.systemType === 'REJECTED';

 return (
 <Card className="overflow-hidden border border-brand-primary/10 hover:border-brand-primary/30 transition-colors">
 <div className="p-6">
 <div className="flex items-start gap-4">
 <div className="w-14 h-14 rounded-2xl bg-brand-bg flex items-center justify-center shrink-0 border border-brand-primary/20 p-2">
 {application.job?.company?.logo
 ? <img src={getFileUrl(application.job.company.logo)} alt="" className="w-full h-full object-contain rounded-xl" />
 : <Briefcase size={24} className="text-brand-primary" />
 }
 </div>
 <div className="flex-1 min-w-0 pt-1">
 <h3 className="font-bold text-gray-900 text-lg leading-tight">{application.job?.title}</h3>
 <p className="text-sm font-medium text-gray-500 mt-1">{application.job?.company?.name}</p>
 <p className="text-xs font-medium text-gray-400 mt-1">Applied {formatRelativeDate(application.appliedAt)}</p>
 </div>
 <Badge className={currentStage?.color || 'bg-brand-bg text-brand-primary'}>{currentStage?.name || 'Applied'}</Badge>
 </div>

 <DynamicTimeline stages={stages} currentStageId={application.stageId} isRejected={isRejected} />

 {nextInterview && (
 <div className="mt-4 p-4 bg-brand-bg rounded-2xl flex items-center gap-3 border border-brand-primary/20">
 <Calendar size={18} className="text-brand-primary" />
 <div>
 <p className="text-sm font-bold text-gray-900 ">Interview: {formatDate(nextInterview.scheduledAt)}</p>
 <p className="text-xs font-medium text-gray-500 mt-0.5">{nextInterview.customTypeName || 'Custom'} {nextInterview.meetingLink && '· Link available'}</p>
 </div>
 </div>
 )}

 {application.offerLetter && (
 <div className="mt-4 p-4 bg-brand-bg rounded-2xl flex items-center justify-between border border-brand-primary/20">
 <div className="flex items-center gap-3">
 <FileText size={18} className="text-brand-primary" />
 <p className="text-sm font-bold text-gray-900 ">Offer Letter Available</p>
 </div>
 <a href={application.offerLetter.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs px-4 py-2">
 <Download size={14} /> Download
 </a>
 </div>
 )}

 <button
 onClick={() => setExpanded(p => !p)}
 className="mt-4 w-full py-2 text-sm font-bold text-gray-500 hover:text-brand-primary flex items-center justify-center gap-1.5 transition-colors rounded-xl hover:bg-brand-bg"
 >
 {expanded ? <><ChevronUp size={16} /> Hide details</> : <><ChevronDown size={16} /> Show details</>}
 </button>

 {expanded && (
 <div className="mt-4 pt-4 border-t border-brand-primary/10 space-y-4 text-sm text-gray-600 ">
 {application.coverLetter && (
 <div><p className="font-bold text-gray-900 mb-1">Cover Letter</p><p className="leading-relaxed font-medium text-gray-500">{application.coverLetter}</p></div>
 )}
 {application.notes && (
 <div><p className="font-bold text-gray-900 mb-1">HR Notes</p><p className="font-medium text-gray-500">{application.notes}</p></div>
 )}
 {application.rejectionReason && (
 <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
 <p className="font-bold text-gray-700">Closure Reason</p>
 <p className="text-gray-500 font-medium mt-1">{application.rejectionReason}</p>
 </div>
 )}
 </div>
 )}
 </div>
 </Card>
 );
};

export default function CandidateApplications() {
 const [applications, setApplications] = useState([]);
 const [loading, setLoading] = useState(true);
 const [filter, setFilter] = useState('');
 const [page, setPage] = useState(1);
 const [total, setTotal] = useState(0);

 useEffect(() => {
 setLoading(true);
 applicationAPI.getCandidateApplications({ status: filter || undefined, page, limit: 10 })
 .then(({ data }) => { setApplications(data.applications); setTotal(data.total); })
 .finally(() => setLoading(false));
 }, [filter, page]);

 const filterBtns = [['', 'All'], ['APPLIED', 'Applied'], ['INTERVIEW_SCHEDULED', 'Interviews'], ['OFFER_SENT', 'Offers'], ['REJECTED', 'Closed']];

 return (
 <div className="max-w-4xl mx-auto space-y-6">
 <div className="page-header">
 <h1 className="page-title">My Applications</h1>
 <p className="page-subtitle">{total} total applications tracking</p>
 </div>

 <div className="flex flex-wrap gap-3">
 {filterBtns.map(([val, label]) => (
 <button
 key={val}
 onClick={() => { setFilter(val); setPage(1); }}
 className={cn(
 'filter-pill',
 filter === val ? 'filter-pill-active' : 'filter-pill-inactive'
 )}
 >
 {label}
 </button>
 ))}
 </div>

 {loading ? (
 <div className="space-y-5">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
 ) : applications.length === 0 ? (
 <Card className="p-10">
 <EmptyState icon={FileText} title="No applications" description={filter ? 'No applications match this filter' : "You haven't applied to any jobs yet"} />
 </Card>
 ) : (
 <div className="space-y-5">
 {applications.map((app, i) => (
 <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
 <ApplicationCard application={app} />
 </motion.div>
 ))}
 </div>
 )}

 {total > 10 && (
 <div className="flex justify-center gap-3 mt-8">
 <Button variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
 <Button variant="secondary" disabled={applications.length < 10} onClick={() => setPage(p => p + 1)}>Next</Button>
 </div>
 )}
 </div>
 );
}
