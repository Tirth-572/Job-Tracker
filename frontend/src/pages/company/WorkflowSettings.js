import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { workflowAPI } from '../../services/api';
import { Card, Button, Input, Modal, Badge, SkeletonCard } from '../../components/ui';
import { Plus, GripVertical, Settings, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WorkflowSettings() {
 const [stages, setStages] = useState([]);
 const [loading, setLoading] = useState(true);
 const [modalOpen, setModalOpen] = useState(false);
 const [editingStage, setEditingStage] = useState(null);
 const [saving, setSaving] = useState(false);

 // Form state
 const [name, setName] = useState('');
 const [isInterview, setIsInterview] = useState(false);
 const [interviewType, setInterviewType] = useState('HR');
 const [instructions, setInstructions] = useState('');

 const fetchStages = async () => {
 try {
 const { data } = await workflowAPI.getWorkflows();
 setStages(data);
 } catch (err) {
 toast.error('Failed to load workflow stages');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchStages();
 }, []);

 const handleOpenModal = (stage = null) => {
 setEditingStage(stage);
 setName(stage?.name || '');
 setIsInterview(stage?.isInterview || false);
 setInterviewType(stage?.interviewType || 'HR');
 setInstructions(stage?.instructions || '');
 setModalOpen(true);
 };

 const handleSave = async (e) => {
 e.preventDefault();
 setSaving(true);
 try {
 if (editingStage) {
 await workflowAPI.updateStage(editingStage.id, { name, isInterview, interviewType, instructions });
 toast.success('Stage updated');
 } else {
 await workflowAPI.createStage({ name, isInterview, interviewType, instructions });
 toast.success('Stage created');
 }
 setModalOpen(false);
 fetchStages();
 } catch (err) {
 toast.error(err.response?.data?.message || 'Failed to save stage');
 } finally {
 setSaving(false);
 }
 };

 const handleDelete = async (id) => {
 if (!window.confirm('Are you sure you want to delete this stage? Candidates will be moved to the first stage.')) return;
 try {
 await workflowAPI.deleteStage(id);
 toast.success('Stage deleted');
 fetchStages();
 } catch (err) {
 toast.error(err.response?.data?.message || 'Failed to delete');
 }
 };

 const onDragEnd = async (result) => {
 if (!result.destination) return;
 if (result.destination.index === result.source.index) return;

 const newStages = Array.from(stages);
 const [reorderedItem] = newStages.splice(result.source.index, 1);
 newStages.splice(result.destination.index, 0, reorderedItem);

 setStages(newStages);

 try {
 await workflowAPI.reorderStages(newStages.map(s => s.id));
 toast.success('Order saved');
 } catch (err) {
 toast.error('Failed to save order');
 fetchStages(); // revert
 }
 };

 if (loading) return <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>;

 return (
 <div className="space-y-6 max-w-4xl">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-gray-900 ">Pipeline Workflow</h1>
 <p className="text-gray-500 mt-1">Customize your hiring pipeline stages and interview types.</p>
 </div>
 <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
 <Plus size={18} /> Add Stage
 </Button>
 </div>

 <Card className="p-0 overflow-hidden bg-gray-50 ">
 <DragDropContext onDragEnd={onDragEnd}>
 <Droppable droppableId="stages">
 {(provided) => (
 <div {...provided.droppableProps} ref={provided.innerRef} className="p-4 space-y-3">
 {stages.map((stage, index) => (
 <Draggable key={stage.id} draggableId={stage.id} index={index} isDragDisabled={stage.isSystem}>
 {(provided, snapshot) => (
 <div
 ref={provided.innerRef}
 {...provided.draggableProps}
 className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500' : ''}`}
 >
 <div className="flex items-center gap-4 flex-1">
 <div {...provided.dragHandleProps} className={`p-2 rounded cursor-grab ${stage.isSystem ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 :bg-gray-700'}`}>
 <GripVertical size={20} />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h3 className="font-semibold text-gray-900 ">{stage.name}</h3>
 {stage.isSystem && <Badge className="bg-gray-100 text-gray-600 border-none text-[10px]">System</Badge>}
 {stage.isInterview && <Badge className="bg-purple-100 text-purple-600 border-none text-[10px]">Interview Stage</Badge>}
 </div>
 {stage.instructions && <p className="text-sm text-gray-500 mt-1 truncate max-w-md">{stage.instructions}</p>}
 </div>
 </div>

 <div className="flex items-center gap-2">
 {!stage.isSystem && (
 <>
 <button onClick={() => handleOpenModal(stage)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
 <Edit2 size={18} />
 </button>
 <button onClick={() => handleDelete(stage.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
 <Trash2 size={18} />
 </button>
 </>
 )}
 </div>
 </div>
 )}
 </Draggable>
 ))}
 {provided.placeholder}
 </div>
 )}
 </Droppable>
 </DragDropContext>
 </Card>

 <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingStage ? 'Edit Stage' : 'New Stage'}>
 <form onSubmit={handleSave} className="space-y-4">
 <Input 
 label="Stage Name" 
 placeholder="e.g. Technical Assignment" 
 value={name} 
 onChange={e => setName(e.target.value)} 
 required 
 />
 
 <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 :bg-gray-800 transition-colors">
 <input 
 type="checkbox" 
 className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-600" 
 checked={isInterview} 
 onChange={e => setIsInterview(e.target.checked)} 
 />
 <div>
 <p className="font-medium text-gray-900 ">This is an Interview Stage</p>
 <p className="text-sm text-gray-500">Candidates in this stage will require an interview schedule.</p>
 </div>
 </label>

 {isInterview && (
 <div className="space-y-4">
 <div className="space-y-1">
 <label className="label">Interview Type</label>
 <select 
 className="input bg-white " 
 value={interviewType} 
 onChange={e => setInterviewType(e.target.value)}
 >
 <option value="HR">HR Screening</option>
 <option value="TECHNICAL">Technical Interview</option>
 <option value="PRACTICAL">Practical Interview</option>
 <option value="QA_ROUND">Question & Answer Round</option>
 <option value="BEHAVIORAL">Behavioral Interview</option>
 <option value="FINAL">Final Interview</option>
 </select>
 </div>
 <div className="space-y-1">
 <label className="label">Default Interviewer Instructions</label>
 <textarea 
 className="input resize-none h-24" 
 placeholder="e.g. Please ask the candidate to walk through their portfolio..."
 value={instructions}
 onChange={e => setInstructions(e.target.value)}
 />
 </div>
 </div>
 )}

 <div className="flex gap-3 pt-2">
 <Button type="submit" loading={saving} className="flex-1">Save Stage</Button>
 <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
 </div>
 </form>
 </Modal>
 </div>
 );
}
