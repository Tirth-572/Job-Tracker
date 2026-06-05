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
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-sm font-medium text-red-700">Application Rejected</span>
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
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all z-10',
                    active ? 'bg-[#635BFF] text-white ring-4 ring-[#635BFF]/20 shadow-md scale-110' :
                    done ? 'bg-[#635BFF] text-white' : 'bg-[#E2E8F0] text-[#94A3B8]'
                  )}>
                    {done ? '✓' : idx + 1}
                  </div>
                  <p className={cn(
                    'absolute top-10 text-[11px] text-center w-20 leading-tight hidden sm:block',
                    active ? 'text-[#635BFF] font-bold' : done ? 'text-[#334155] font-medium' : 'text-[#94A3B8]'
                  )}>
                    {stage.name}
                  </p>
                </div>
                {idx < timelineStages.length - 1 && (
                  <div className={cn(
                    'flex-1 h-[2px] min-w-[32px] mx-1 transition-all rounded-full',
                    idx < currentIdx ? 'bg-[#635BFF]' : 'bg-[#E2E8F0]'
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
 <Card className="overflow-hidden">
 <div className="p-5">
 <div className="flex items-start gap-3">
 <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
 {application.job?.company?.logo
 ? <img src={getFileUrl(application.job.company.logo)} alt="" className="w-full h-full object-contain rounded-xl" />
 : <Briefcase size={20} className="text-gray-400" />
 }
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-semibold text-gray-900 ">{application.job?.title}</h3>
 <p className="text-sm text-gray-500">{application.job?.company?.name}</p>
 <p className="text-xs text-gray-400 mt-0.5">Applied {formatRelativeDate(application.appliedAt)}</p>
 </div>
 <Badge className={currentStage?.color || 'bg-gray-100 text-gray-700'}>{currentStage?.name || 'Applied'}</Badge>
 </div>

 <DynamicTimeline stages={stages} currentStageId={application.stageId} isRejected={isRejected} />

 {nextInterview && (
 <div className="mt-3 p-3 bg-purple-50 rounded-lg flex items-center gap-2">
 <Calendar size={16} className="text-purple-600" />
 <div>
 <p className="text-sm font-medium text-purple-700 ">Interview: {formatDate(nextInterview.scheduledAt)}</p>
 <p className="text-xs text-purple-500">{nextInterview.customTypeName || 'Custom'} {nextInterview.meetingLink && '· Link available'}</p>
 </div>
 </div>
 )}

 {application.offerLetter && (
 <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center justify-between">
 <div className="flex items-center gap-2">
 <FileText size={16} className="text-green-600" />
 <p className="text-sm font-medium text-green-700 ">Offer Letter Available</p>
 </div>
 <a href={application.offerLetter.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs px-3 py-1.5">
 <Download size={14} /> Download
 </a>
 </div>
 )}

 <button
 onClick={() => setExpanded(p => !p)}
 className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
 >
 {expanded ? <><ChevronUp size={14} /> Hide details</> : <><ChevronDown size={14} /> Show details</>}
 </button>

 {expanded && (
 <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm text-gray-600 ">
 {application.coverLetter && (
 <div><p className="font-medium text-gray-800 mb-1">Cover Letter</p><p className="leading-relaxed">{application.coverLetter}</p></div>
 )}
 {application.notes && (
 <div><p className="font-medium text-gray-800 mb-1">HR Notes</p><p>{application.notes}</p></div>
 )}
 {application.rejectionReason && (
 <div className="p-2 bg-red-50 rounded">
 <p className="font-medium text-red-600">Rejection Reason</p>
 <p className="text-red-500">{application.rejectionReason}</p>
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

 // Keep these filters for simplicity, they map to the macro application 'status'
 const filterBtns = [['', 'All'], ['APPLIED', 'Applied'], ['INTERVIEW_SCHEDULED', 'Interviews'], ['OFFER_SENT', 'Offers'], ['REJECTED', 'Rejected']];

 return (
 <div className="max-w-4xl mx-auto space-y-5">
 <div>
 <h1 className="text-2xl font-bold text-gray-900 ">My Applications</h1>
 <p className="text-gray-500 mt-1">{total} total applications</p>
 </div>

 <div className="flex flex-wrap gap-2">
 {filterBtns.map(([val, label]) => (
 <button
 key={val}
 onClick={() => { setFilter(val); setPage(1); }}
 className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-all border', filter === val ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:border-gray-300')}
 >
 {label}
 </button>
 ))}
 </div>

 {loading ? (
 <div className="space-y-4">{[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}</div>
 ) : applications.length === 0 ? (
 <Card className="p-8">
 <EmptyState icon={FileText} title="No applications" description={filter ? 'No applications match this filter' : "You haven't applied to any jobs yet"} />
 </Card>
 ) : (
 <div className="space-y-4">
 {applications.map((app, i) => (
 <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
 <ApplicationCard application={app} />
 </motion.div>
 ))}
 </div>
 )}

 {total > 10 && (
 <div className="flex justify-center gap-2">
 <Button variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
 <Button variant="secondary" disabled={applications.length < 10} onClick={() => setPage(p => p + 1)}>Next</Button>
 </div>
 )}
 </div>
 );
}
