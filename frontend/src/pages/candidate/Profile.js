import React, { useState, useEffect, useRef } from 'react';
import { Edit2, Plus, Trash2, Upload, X, Briefcase, GraduationCap, Link2, GitBranch, Globe, FileText, Download, Eye, CheckCircle, Lock } from 'lucide-react';
import { candidateAPI, authAPI } from '../../services/api';
import { Card, Button, Input, Textarea, Modal, Avatar, Badge } from '../../components/ui';
import { formatDate, getFileUrl } from '../../lib/utils';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useDropzone } from 'react-dropzone';
import { INDUSTRIES } from '../auth/AuthPages';

import { useLocation } from 'react-router-dom';

const SKILL_SUGGESTIONS = ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'TypeScript', 'SQL', 'AWS', 'Docker', 'Git'];

export default function CandidateProfile() {
 const { user, refreshUser } = useAuth();
 const location = useLocation();
 const [profile, setProfile] = useState(null);
 const [loading, setLoading] = useState(true);
 const [editProfile, setEditProfile] = useState(false);
 const [expModal, setExpModal] = useState(false);
 const [eduModal, setEduModal] = useState(false);
 const [editingExp, setEditingExp] = useState(null);
 const [editingEdu, setEditingEdu] = useState(null);
 const [saving, setSaving] = useState(false);
 const [skillInput, setSkillInput] = useState('');

 const [profileForm, setProfileForm] = useState({});
 const [expForm, setExpForm] = useState({});
 const [eduForm, setEduForm] = useState({});

 useEffect(() => {
 candidateAPI.getProfile().then(({ data }) => {
 setProfile(data);
 setProfileForm(data);
 
 if (location.state?.openModal) {
    const key = location.state.openModal;
    const editProfileFields = ['firstName', 'lastName', 'phone', 'dob', 'gender', 'bio', 'location', 'industry', 'jobTitle', 'linkedinUrl', 'githubUrl', 'portfolioUrl', 'skills'];
    if (editProfileFields.includes(key)) {
        setProfileForm(data);
        setEditProfile(true);
    } else if (key === 'experience') {
        setEditingExp(null);
        setExpForm({ current: false });
        setExpModal(true);
    } else if (key === 'education') {
        setEditingEdu(null);
        setEduForm({ current: false });
        setEduModal(true);
    } else if (key === 'avatar' || key === 'resumeUrl') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Clean up state
    window.history.replaceState({}, document.title);
 }
 }).finally(() => setLoading(false));
 }, []);

 const [uploading, setUploading] = useState(false);
 const [uploadProgress, setUploadProgress] = useState(0);
 const fileInputRef = useRef(null);

 const handleResumeUpload = async (file) => {
 if (!file) return;
 const allowed = ['.pdf', '.doc', '.docx'];
 const ext = '.' + file.name.split('.').pop().toLowerCase();
 if (!allowed.includes(ext)) return toast.error('Only PDF, DOC, DOCX files allowed');
 if (file.size > 10 * 1024 * 1024) return toast.error('File size must be under 10MB');

 const fd = new FormData();
 fd.append('resume', file);
 setUploading(true);
 setUploadProgress(0);
 try {
 const { data } = await candidateAPI.uploadResume(fd);
 setProfile(p => ({ ...p, resumeUrl: data.resumeUrl, resumeName: data.resumeName }));
 toast.success('Resume uploaded successfully!');
 } catch (err) {
 toast.error(err.response?.data?.message || 'Upload failed');
 } finally {
 setUploading(false);
 setUploadProgress(0);
 }
 };

 const handleRemoveResume = async () => {
 if (!window.confirm('Are you sure you want to remove your resume?')) return;
 try {
 await candidateAPI.removeResume();
 setProfile(p => ({ ...p, resumeUrl: null, resumeName: null }));
 toast.success('Resume removed successfully!');
 } catch (err) {
 toast.error(err.response?.data?.message || 'Failed to remove resume');
 }
 };

 const handleAvatarUpload = async (file) => {
 if (!file) return;
 const fd = new FormData();
 fd.append('avatar', file);
 try {
 const { data } = await candidateAPI.uploadAvatar(fd);
 setProfile(p => ({ ...p, avatar: data.avatar }));
 await refreshUser();
 toast.success('Avatar updated!');
 } catch { toast.error('Upload failed'); }
 };

 const handleRemoveAvatar = async () => {
 try {
 await candidateAPI.removeAvatar();
 setProfile(p => ({ ...p, avatar: null }));
 await refreshUser();
 toast.success('Avatar removed!');
 } catch { toast.error('Failed to remove avatar'); }
 };

 const saveProfile = async () => {
 setSaving(true);
 try {
 const { data } = await candidateAPI.updateProfile(profileForm);
 setProfile(data);
 await refreshUser();
 setEditProfile(false);
 toast.success('Profile updated!');
 } catch { toast.error('Update failed'); }
 finally { setSaving(false); }
 };

 const addSkill = (skill) => {
 const s = (skill || skillInput).trim();
 if (!s) return;
 const skills = [...(profileForm.skills || [])];
 if (!skills.includes(s)) {
 const updated = [...skills, s];
 setProfileForm(p => ({ ...p, skills: updated }));
 }
 setSkillInput('');
 };

 const removeSkill = (skill) => setProfileForm(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }));

 const saveExp = async () => {
 if (!expForm.title?.trim()) return toast.error('Job title is required');
 if (!expForm.company?.trim()) return toast.error('Company is required');
 if (!expForm.startDate) return toast.error('Start date is required');

 setSaving(true);
 try {
 if (editingExp?.id) {
 const { data } = await candidateAPI.updateExperience(editingExp.id, expForm);
 setProfile(p => ({ ...p, experiences: p.experiences.map(e => e.id === data.id ? data : e) }));
 } else {
 const { data } = await candidateAPI.addExperience(expForm);
 setProfile(p => ({ ...p, experiences: [...(p.experiences || []), data] }));
 }
 setExpModal(false);
 setExpForm({ current: false });
 toast.success('Experience saved!');
 } catch (err) {
 toast.error(err.response?.data?.message || 'Failed to save experience');
 } finally { setSaving(false); }
 };

 const deleteExp = async (id) => {
 if (!window.confirm('Delete this experience?')) return;
 try {
 await candidateAPI.deleteExperience(id);
 setProfile(p => ({ ...p, experiences: p.experiences.filter(e => e.id !== id) }));
 toast.success('Experience deleted');
 } catch (err) {
 toast.error(err.response?.data?.message || 'Failed to delete');
 }
 };

 const saveEdu = async () => {
 if (!eduForm.school?.trim()) return toast.error('School name is required');
 if (!eduForm.degree?.trim()) return toast.error('Degree is required');
 if (!eduForm.field?.trim()) return toast.error('Field of study is required');
 if (!eduForm.startDate) return toast.error('Start date is required');

 setSaving(true);
 try {
 if (editingEdu?.id) {
 const { data } = await candidateAPI.updateEducation(editingEdu.id, eduForm);
 setProfile(p => ({ ...p, educations: p.educations.map(e => e.id === data.id ? data : e) }));
 } else {
 const { data } = await candidateAPI.addEducation(eduForm);
 setProfile(p => ({ ...p, educations: [...(p.educations || []), data] }));
 }
 setEduModal(false);
 setEduForm({ current: false });
 toast.success('Education saved!');
 } catch (err) {
 toast.error(err.response?.data?.message || 'Failed to save education');
 } finally { setSaving(false); }
 };

 const deleteEdu = async (id) => {
 if (!window.confirm('Delete this education?')) return;
 try {
 await candidateAPI.deleteEducation(id);
 setProfile(p => ({ ...p, educations: p.educations.filter(e => e.id !== id) }));
 toast.success('Education deleted');
 } catch (err) {
 toast.error(err.response?.data?.message || 'Failed to delete');
 }
 };

 if (loading) return <div className="animate-pulse space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}</div>;

 return (
 <div className="max-w-3xl mx-auto space-y-5">
 {/* Header Card */}
 <Card className="p-6">
 <div className="flex items-start gap-5">
 <div className="relative inline-block">
 <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-input').click()}>
 <Avatar src={getFileUrl(profile?.avatar)} name={`${profile?.firstName} ${profile?.lastName}`} size="xl" />
 <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
 <Upload size={20} className="text-white" />
 </div>
 <div className="absolute bottom-0 right-0 bg-primary-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm pointer-events-none">
 <Edit2 size={14} />
 </div>
 <input
 id="avatar-input"
 type="file"
 className="hidden"
 accept="image/*"
 onChange={(e) => handleAvatarUpload(e.target.files[0])}
 />
 </div>
 {profile?.avatar && (
 <button
 onClick={(e) => { e.stopPropagation(); handleRemoveAvatar(); }}
 className="absolute top-0 right-0 bg-red-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm hover:bg-red-600 transition-colors z-10"
 title="Remove Photo"
 >
 <Trash2 size={12} />
 </button>
 )}
 </div>
 <div className="flex-1">
 <div className="flex items-start justify-between">
 <div>
 <h2 className="text-xl font-bold text-gray-900 ">{profile?.firstName} {profile?.lastName}</h2>
 {profile?.jobTitle && <p className="text-brand-primary font-bold text-sm mt-0.5">{profile.jobTitle}</p>}
 <p className="text-gray-500 mt-1">{user?.email}</p>
 {profile?.location && <p className="text-sm text-gray-400 mt-0.5">{profile.location}</p>}
 {(profile?.dob || profile?.gender || profile?.industry) && (
   <p className="text-xs text-gray-400 mt-1 flex gap-2">
     {profile?.industry && <span>Industry: {profile.industry}</span>}
     {profile?.dob && <span>DOB: {new Date(profile.dob).toLocaleDateString()}</span>}
     {profile?.gender && <span>Gender: {profile.gender}</span>}
   </p>
 )}
 </div>
 <Button variant="secondary" size="sm" onClick={() => { setProfileForm(profile); setEditProfile(true); }}>
 <Edit2 size={14} /> Edit
 </Button>
 </div>
 {profile?.bio && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{profile.bio}</p>}
 <div className="flex gap-3 mt-3">
 {profile?.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm flex items-center gap-1"><Link2 size={14} /> LinkedIn</a>}
 {profile?.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:underline text-sm flex items-center gap-1"><GitBranch size={14} /> GitHub</a>}
 {profile?.portfolioUrl && <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:underline text-sm flex items-center gap-1"><Globe size={14} /> Portfolio</a>}
 </div>
 </div>
 </div>
 </Card>

 {/* Resume */}
 <Card className="p-5">
 <div className="flex items-center justify-between mb-4">
 <h3 className="font-semibold flex items-center gap-2 text-gray-900 ">
 <FileText size={16} className="text-primary-600" /> Resume
 </h3>
 {profile?.resumeUrl && (
 <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
 <CheckCircle size={13} /> Uploaded
 </span>
 )}
 </div>

 {profile?.resumeUrl ? (
 <div className="border border-gray-200 rounded-xl overflow-hidden">
 {/* File Info Row */}
 <div className="flex items-center gap-3 p-4 bg-gray-50 ">
 <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
 <FileText size={20} className="text-red-600 " />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-gray-900 truncate">
 {profile.resumeName || 'resume.pdf'}
 </p>
 <p className="text-xs text-gray-400 mt-0.5">PDF / DOC / DOCX</p>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex items-center gap-2 p-3 border-t border-gray-200 bg-white ">
 <a
 href={getFileUrl(profile.resumeUrl)}
 target="_blank"
 rel="noopener noreferrer"
 className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
 >
 <Eye size={14} /> View Resume
 </a>
 <a
 href={getFileUrl(profile.resumeUrl)}
 download={profile.resumeName || 'resume'}
 className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 :bg-gray-700 transition-colors"
 >
 <Download size={14} /> Download
 </a>
 <label className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 :bg-gray-700 transition-colors cursor-pointer">
 <Upload size={14} />
 {uploading ? 'Uploading...' : 'Replace'}
 <input
 type="file"
 className="hidden"
 accept=".pdf,.doc,.docx"
 disabled={uploading}
 onChange={e => handleResumeUpload(e.target.files[0])}
 />
 </label>
 <button
 onClick={handleRemoveResume}
 className="flex items-center justify-center gap-1 px-3 py-2 bg-white border border-red-200 text-red-500 text-sm font-medium rounded-lg hover:bg-red-50 :bg-red-900/20 transition-colors"
 title="Remove resume"
 >
 <Trash2 size={14} />
 </button>
 </div>

 {/* Upload progress */}
 {uploading && (
 <div className="px-4 pb-3">
 <div className="w-full bg-gray-200 rounded-full h-1.5">
 <div className="bg-primary-600 h-1.5 rounded-full animate-pulse w-3/4" />
 </div>
 <p className="text-xs text-gray-400 mt-1">Uploading...</p>
 </div>
 )}
 </div>
 ) : (
 /* Upload Area */
 <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 :bg-primary-900/10 transition-all group">
 <input
 type="file"
 className="hidden"
 accept=".pdf,.doc,.docx"
 disabled={uploading}
 onChange={e => handleResumeUpload(e.target.files[0])}
 />
 <div className="w-14 h-14 rounded-2xl bg-gray-100 group-hover:bg-primary-100 :bg-primary-900/30 flex items-center justify-center mx-auto mb-3 transition-colors">
 {uploading
 ? <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
 : <Upload size={24} className="text-gray-400 group-hover:text-primary-600 transition-colors" />
 }
 </div>
 <p className="text-sm font-medium text-gray-700 ">
 {uploading ? 'Uploading your resume...' : 'Click to upload your resume'}
 </p>
 <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX — Max 10MB</p>
 </label>
 )}
 </Card>

 {/* Skills */}
 <Card className="p-5">
 <h3 className="font-semibold mb-3">Skills</h3>
 <div className="flex flex-wrap gap-2 mb-3">
 {(profile?.skills || []).map(s => (
 <Badge key={s} className="bg-primary-100 text-primary-700 gap-1">
 {s}
 </Badge>
 ))}
 {(!profile?.skills || profile.skills.length === 0) && <p className="text-sm text-gray-400">No skills added yet</p>}
 </div>
 <Button variant="secondary" size="sm" onClick={() => { setProfileForm(profile); setEditProfile(true); }}>
 <Edit2 size={14} /> Edit Skills
 </Button>
 </Card>

 {/* Experience */}
 <Card className="p-5">
 <div className="flex items-center justify-between mb-4">
 <h3 className="font-semibold flex items-center gap-2"><Briefcase size={16} /> Experience</h3>
 <Button variant="secondary" size="sm" onClick={() => { setEditingExp(null); setExpForm({ current: false }); setExpModal(true); }}>
 <Plus size={14} /> Add
 </Button>
 </div>
 <div className="space-y-4">
 {(profile?.experiences || []).map(exp => (
 <div key={exp.id} className="flex gap-3">
 <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
 <Briefcase size={16} className="text-gray-400" />
 </div>
 <div className="flex-1">
 <div className="flex items-start justify-between">
 <div>
 <p className="font-medium text-gray-900 ">{exp.title}</p>
 <p className="text-sm text-gray-500">{exp.company} {exp.location && `· ${exp.location}`}</p>
 <p className="text-xs text-gray-400">{formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}</p>
 </div>
 <div className="flex gap-1">
 <button onClick={() => { setEditingExp(exp); setExpForm(exp); setExpModal(true); }} className="p-1.5 hover:bg-gray-100 :bg-gray-800 rounded-lg"><Edit2 size={14} className="text-gray-400" /></button>
 <button onClick={() => deleteExp(exp.id)} className="p-1.5 hover:bg-red-50 :bg-red-900/20 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
 </div>
 </div>
 {exp.description && <p className="text-sm text-gray-600 mt-1">{exp.description}</p>}
 </div>
 </div>
 ))}
 {(!profile?.experiences || profile.experiences.length === 0) && <p className="text-sm text-gray-400 text-center py-4">No experience added yet</p>}
 </div>
 </Card>

 {/* Education */}
 <Card className="p-5">
 <div className="flex items-center justify-between mb-4">
 <h3 className="font-semibold flex items-center gap-2"><GraduationCap size={16} /> Education</h3>
 <Button variant="secondary" size="sm" onClick={() => { setEditingEdu(null); setEduForm({ current: false }); setEduModal(true); }}>
 <Plus size={14} /> Add
 </Button>
 </div>
 <div className="space-y-4">
 {(profile?.educations || []).map(edu => (
 <div key={edu.id} className="flex gap-3">
 <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
 <GraduationCap size={16} className="text-gray-400" />
 </div>
 <div className="flex-1">
 <div className="flex items-start justify-between">
 <div>
 <p className="font-medium text-gray-900 ">{edu.school}</p>
 <p className="text-sm text-gray-500">{edu.degree} in {edu.field}</p>
 <p className="text-xs text-gray-400">{formatDate(edu.startDate)} – {edu.current ? 'Present' : formatDate(edu.endDate)}</p>
 </div>
 <div className="flex gap-1">
 <button onClick={() => { setEditingEdu(edu); setEduForm(edu); setEduModal(true); }} className="p-1.5 hover:bg-gray-100 :bg-gray-800 rounded-lg"><Edit2 size={14} className="text-gray-400" /></button>
 <button onClick={() => deleteEdu(edu.id)} className="p-1.5 hover:bg-red-50 :bg-red-900/20 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
 </div>
 </div>
 </div>
 </div>
 ))}
 {(!profile?.educations || profile.educations.length === 0) && <p className="text-sm text-gray-400 text-center py-4">No education added yet</p>}
 </div>
 </Card>

 {/* Edit Profile Modal */}
 <Modal isOpen={editProfile} onClose={() => setEditProfile(false)} title="Edit Profile" size="lg">
 <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={profileForm.firstName || ''} onChange={e => setProfileForm(p => ({ ...p, firstName: e.target.value }))} />
            <Input label="Last Name" value={profileForm.lastName || ''} onChange={e => setProfileForm(p => ({ ...p, lastName: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date of Birth" type="date" value={profileForm.dob?.split('T')[0] || ''} onChange={e => setProfileForm(p => ({ ...p, dob: e.target.value }))} />
            <div>
              <label className="label">Gender</label>
              <select className="input mt-1" value={profileForm.gender || ''} onChange={e => setProfileForm(p => ({ ...p, gender: e.target.value }))}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
 <div className="grid grid-cols-2 gap-3">
   <Input label="Job Title" placeholder="e.g. Frontend Developer" value={profileForm.jobTitle || ''} onChange={e => setProfileForm(p => ({ ...p, jobTitle: e.target.value }))} />
   <div>
     <label className="label">Industry</label>
     <select className="input mt-1" value={profileForm.industry || ''} onChange={e => setProfileForm(p => ({ ...p, industry: e.target.value }))}>
       <option value="">Select</option>
       {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
     </select>
   </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
   <Input label="Phone" value={profileForm.phone || ''} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
   <Input label="Location" value={profileForm.location || ''} onChange={e => setProfileForm(p => ({ ...p, location: e.target.value }))} />
 </div>
 <Textarea label="Bio" rows={3} value={profileForm.bio || ''} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} />
 <Input label="LinkedIn URL" value={profileForm.linkedinUrl || ''} onChange={e => setProfileForm(p => ({ ...p, linkedinUrl: e.target.value }))} />
 <Input label="GitHub URL" value={profileForm.githubUrl || ''} onChange={e => setProfileForm(p => ({ ...p, githubUrl: e.target.value }))} />
 <Input label="Portfolio URL" value={profileForm.portfolioUrl || ''} onChange={e => setProfileForm(p => ({ ...p, portfolioUrl: e.target.value }))} />
 <div>
 <label className="label">Skills</label>
 <div className="flex flex-wrap gap-2 mb-2">
 {(profileForm.skills || []).map(s => (
 <Badge key={s} className="bg-primary-100 text-primary-700 gap-1 cursor-pointer" onClick={() => removeSkill(s)}>
 {s} <X size={12} />
 </Badge>
 ))}
 </div>
 <div className="flex gap-2">
 <input className="input flex-1" placeholder="Add skill..." value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
 <Button variant="secondary" size="sm" onClick={() => addSkill()}>Add</Button>
 </div>
 <div className="flex flex-wrap gap-1 mt-2">
 {SKILL_SUGGESTIONS.filter(s => !(profileForm.skills || []).includes(s)).slice(0, 5).map(s => (
 <button key={s} onClick={() => addSkill(s)} className="text-xs px-2 py-1 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors">{s}</button>
 ))}
 </div>
 </div>
 <div className="flex gap-3 pt-2">
 <Button onClick={saveProfile} loading={saving} className="flex-1">Save Changes</Button>
 <Button variant="secondary" onClick={() => setEditProfile(false)}>Cancel</Button>
 </div>
 </div>
 </Modal>

 {/* Experience Modal */}
 <Modal isOpen={expModal} onClose={() => setExpModal(false)} title={editingExp ? 'Edit Experience' : 'Add Experience'}>
 <div className="space-y-3">
 <Input label="Job Title" value={expForm.title || ''} onChange={e => setExpForm(p => ({ ...p, title: e.target.value }))} />
 <Input label="Company" value={expForm.company || ''} onChange={e => setExpForm(p => ({ ...p, company: e.target.value }))} />
 <Input label="Location" value={expForm.location || ''} onChange={e => setExpForm(p => ({ ...p, location: e.target.value }))} />
 <div className="grid grid-cols-2 gap-3">
 <Input label="Start Date" type="date" value={expForm.startDate?.split('T')[0] || ''} onChange={e => setExpForm(p => ({ ...p, startDate: e.target.value }))} />
 <Input label="End Date" type="date" value={expForm.endDate?.split('T')[0] || ''} onChange={e => setExpForm(p => ({ ...p, endDate: e.target.value }))} disabled={expForm.current} />
 </div>
 <label className="flex items-center gap-2 cursor-pointer">
 <input type="checkbox" checked={expForm.current || false} onChange={e => setExpForm(p => ({ ...p, current: e.target.checked }))} className="rounded" />
 <span className="text-sm text-gray-700 ">Currently working here</span>
 </label>
 <Textarea label="Description" rows={3} value={expForm.description || ''} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} />
 <div className="flex gap-3">
 <Button onClick={saveExp} loading={saving} className="flex-1">Save</Button>
 <Button variant="secondary" onClick={() => setExpModal(false)}>Cancel</Button>
 </div>
 </div>
 </Modal>

 {/* Education Modal */}
 <Modal isOpen={eduModal} onClose={() => setEduModal(false)} title={editingEdu ? 'Edit Education' : 'Add Education'}>
 <div className="space-y-3">
 <Input label="School / University" value={eduForm.school || ''} onChange={e => setEduForm(p => ({ ...p, school: e.target.value }))} />
 <Input label="Degree" value={eduForm.degree || ''} onChange={e => setEduForm(p => ({ ...p, degree: e.target.value }))} />
 <Input label="Field of Study" value={eduForm.field || ''} onChange={e => setEduForm(p => ({ ...p, field: e.target.value }))} />
 <div className="grid grid-cols-2 gap-3">
 <Input label="Start Date" type="date" value={eduForm.startDate?.split('T')[0] || ''} onChange={e => setEduForm(p => ({ ...p, startDate: e.target.value }))} />
 <Input label="End Date" type="date" value={eduForm.endDate?.split('T')[0] || ''} onChange={e => setEduForm(p => ({ ...p, endDate: e.target.value }))} disabled={eduForm.current} />
 </div>
 <label className="flex items-center gap-2 cursor-pointer">
 <input type="checkbox" checked={eduForm.current || false} onChange={e => setEduForm(p => ({ ...p, current: e.target.checked }))} className="rounded" />
 <span className="text-sm text-gray-700 ">Currently studying</span>
 </label>
 <div className="flex gap-3">
 <Button onClick={saveEdu} loading={saving} className="flex-1">Save</Button>
 <Button variant="secondary" onClick={() => setEduModal(false)}>Cancel</Button>
 </div>
 </div>
 </Modal>
 </div>
 );
}
