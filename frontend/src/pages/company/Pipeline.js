import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { User, Briefcase, Calendar, MessageSquare, MoreVertical } from 'lucide-react';
import { applicationAPI } from '../../services/api';
import { Badge, Avatar, Modal, Button, Input, Textarea, Select } from '../../components/ui';
import { STATUS_CONFIG, formatRelativeDate, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const COLUMNS = [
  'APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED',
  'INTERVIEW_COMPLETED', 'SELECTED', 'OFFER_SENT', 'JOINED', 'REJECTED'
];

const COLUMN_COLORS = {
  APPLIED: 'border-blue-400',
  UNDER_REVIEW: 'border-amber-400',
  SHORTLISTED: 'border-indigo-400',
  INTERVIEW_SCHEDULED: 'border-purple-400',
  INTERVIEW_COMPLETED: 'border-cyan-400',
  SELECTED: 'border-green-400',
  OFFER_SENT: 'border-orange-400',
  JOINED: 'border-emerald-400',
  REJECTED: 'border-red-400',
};

const ApplicationCard = ({ app, index, onAction }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <Draggable draggableId={app.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            'bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 cursor-grab active:cursor-grabbing transition-shadow',
            snapshot.isDragging && 'shadow-lg rotate-1 ring-2 ring-primary-400'
          )}
        >
          <div className="flex items-start gap-2 mb-2">
            <Avatar
              name={`${app.candidate?.firstName} ${app.candidate?.lastName}`}
              src={app.candidate?.avatar}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {app.candidate?.firstName} {app.candidate?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{app.job?.title}</p>
            </div>
            <div className="relative">
              <button onClick={() => setMenuOpen(p => !p)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <MoreVertical size={14} className="text-gray-400" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-10 py-1">
                  <button onClick={() => { onAction('view', app); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"><User size={14} /> View Profile</button>
                  <button onClick={() => { onAction('interview', app); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"><Calendar size={14} /> Schedule Interview</button>
                  <button onClick={() => { onAction('reject', app); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">Reject</button>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400">{formatRelativeDate(app.appliedAt)}</p>
          {app.interviews?.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-purple-500">
              <Calendar size={11} /> {new Date(app.interviews[0].scheduledAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default function Pipeline() {
  const [board, setBoard] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [interviewForm, setInterviewForm] = useState({ type: 'VIDEO', duration: 60 });
  const [statusForm, setStatusForm] = useState({ notes: '', rejectionReason: '' });
  const [saving, setSaving] = useState(false);

  const fetchBoard = async () => {
    const { data } = await applicationAPI.getCompanyApplications({ limit: 200 });
    const grouped = {};
    COLUMNS.forEach(col => { grouped[col] = []; });
    data.applications.forEach(app => {
      if (grouped[app.status]) grouped[app.status].push(app);
    });
    setBoard(grouped);
    setLoading(false);
  };

  useEffect(() => { fetchBoard(); }, []);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;
    const app = board[source.droppableId].find(a => a.id === draggableId);
    if (!app) return;

    // Optimistic update
    setBoard(prev => {
      const next = { ...prev };
      next[source.droppableId] = next[source.droppableId].filter(a => a.id !== draggableId);
      next[destination.droppableId] = [{ ...app, status: newStatus }, ...next[destination.droppableId]];
      return next;
    });

    try {
      await applicationAPI.updateStatus(draggableId, { status: newStatus });
      toast.success(`Moved to ${STATUS_CONFIG[newStatus]?.label}`);
    } catch (err) {
      toast.error('Failed to update status');
      fetchBoard(); // revert
    }
  };

  const handleAction = (type, app) => {
    setSelectedApp(app);
    setActionModal(type);
    setStatusForm({ notes: '', rejectionReason: '' });
    setInterviewForm({ type: 'VIDEO', duration: 60 });
  };

  const handleInterview = async () => {
    setSaving(true);
    try {
      await applicationAPI.scheduleInterview(selectedApp.id, interviewForm);
      toast.success('Interview scheduled!');
      setActionModal(null);
      fetchBoard();
    } catch { toast.error('Failed to schedule'); }
    finally { setSaving(false); }
  };

  const handleReject = async () => {
    setSaving(true);
    try {
      await applicationAPI.updateStatus(selectedApp.id, { status: 'REJECTED', ...statusForm });
      toast.success('Application rejected');
      setActionModal(null);
      fetchBoard();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map(col => (
        <div key={col} className="min-w-56 bg-gray-100 dark:bg-gray-800 rounded-xl p-3 animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
          {[...Array(2)].map((_, i) => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl mb-2" />)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hiring Pipeline</h1>
        <p className="text-gray-500 mt-1">Drag & drop candidates between stages</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
          {COLUMNS.map(col => {
            const cfg = STATUS_CONFIG[col] || {};
            const cards = board[col] || [];
            return (
              <div key={col} className={cn('min-w-52 max-w-56 flex-shrink-0 bg-gray-50 dark:bg-gray-900 rounded-xl border-t-4', COLUMN_COLORS[col])}>
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{cfg.label}</h3>
                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full px-2 py-0.5">{cards.length}</span>
                  </div>
                </div>
                <Droppable droppableId={col}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn('p-2 space-y-2 min-h-32 transition-colors', snapshot.isDraggingOver && 'bg-primary-50/50 dark:bg-primary-900/10')}
                    >
                      {cards.map((app, idx) => (
                        <ApplicationCard key={app.id} app={app} index={idx} onAction={handleAction} />
                      ))}
                      {provided.placeholder}
                      {cards.length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-center py-6 text-xs text-gray-400">Drop here</div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Interview Modal */}
      <Modal isOpen={actionModal === 'interview'} onClose={() => setActionModal(null)} title="Schedule Interview">
        <div className="space-y-3">
          {selectedApp && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium">{selectedApp.candidate?.firstName} {selectedApp.candidate?.lastName}</p>
              <p className="text-sm text-gray-500">{selectedApp.job?.title}</p>
            </div>
          )}
          <Select label="Interview Type" value={interviewForm.type} onChange={e => setInterviewForm(p => ({ ...p, type: e.target.value }))}>
            <option value="VIDEO">Video Call</option>
            <option value="PHONE">Phone</option>
            <option value="IN_PERSON">In Person</option>
            <option value="TECHNICAL">Technical</option>
          </Select>
          <Input label="Date & Time" type="datetime-local" value={interviewForm.scheduledAt || ''} onChange={e => setInterviewForm(p => ({ ...p, scheduledAt: e.target.value }))} />
          <Input label="Duration (minutes)" type="number" value={interviewForm.duration} onChange={e => setInterviewForm(p => ({ ...p, duration: parseInt(e.target.value) }))} />
          <Input label="Meeting Link" placeholder="https://meet.google.com/..." value={interviewForm.meetingLink || ''} onChange={e => setInterviewForm(p => ({ ...p, meetingLink: e.target.value }))} />
          <Input label="Location (for in-person)" value={interviewForm.location || ''} onChange={e => setInterviewForm(p => ({ ...p, location: e.target.value }))} />
          <Textarea label="Notes" rows={2} value={interviewForm.notes || ''} onChange={e => setInterviewForm(p => ({ ...p, notes: e.target.value }))} />
          <div className="flex gap-3">
            <Button onClick={handleInterview} loading={saving} className="flex-1">Schedule</Button>
            <Button variant="secondary" onClick={() => setActionModal(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={actionModal === 'reject'} onClose={() => setActionModal(null)} title="Reject Application">
        <div className="space-y-3">
          <p className="text-sm text-gray-500">This will send a rejection notification to the candidate.</p>
          <Textarea label="Rejection Reason (optional)" rows={3} value={statusForm.rejectionReason} onChange={e => setStatusForm(p => ({ ...p, rejectionReason: e.target.value }))} placeholder="Provide a reason to help the candidate improve..." />
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleReject} loading={saving} className="flex-1">Reject</Button>
            <Button variant="secondary" onClick={() => setActionModal(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
