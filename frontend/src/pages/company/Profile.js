import React, { useState, useEffect } from 'react';
import { Globe, MapPin, Users, Upload, Edit2, Lock, Trash2 } from 'lucide-react';
import { companyAPI, authAPI } from '../../services/api';
import { Card, Button, Input, Textarea, Select, Avatar } from '../../components/ui';
import { getFileUrl } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';

export default function CompanyProfile() {
 const { refreshUser } = useAuth();
 const [company, setCompany] = useState(null);
 const [editing, setEditing] = useState(false);
 const [form, setForm] = useState({});
 const [saving, setSaving] = useState(false);

 useEffect(() => {
 companyAPI.getProfile().then(({ data }) => { setCompany(data); setForm(data); });
 }, []);

 const { getRootProps, getInputProps } = useDropzone({
 accept: { 'image/*': [] },
 maxFiles: 1,
 onDrop: async ([file]) => {
 const fd = new FormData();
 fd.append('logo', file);
 try {
 const { data } = await companyAPI.uploadLogo(fd);
 setCompany(p => ({ ...p, logo: data.logo }));
 await refreshUser();
 toast.success('Logo updated!');
 } catch { toast.error('Upload failed'); }
 },
 });

 const handleRemoveLogo = async () => {
 try {
 await companyAPI.removeLogo();
 setCompany(p => ({ ...p, logo: null }));
 await refreshUser();
 toast.success('Logo removed!');
 } catch { toast.error('Failed to remove logo'); }
 };

 const save = async () => {
 setSaving(true);
 try {
 const { data } = await companyAPI.updateProfile(form);
 setCompany(data);
 setEditing(false);
 toast.success('Profile updated!');
 } catch { toast.error('Update failed'); }
 finally { setSaving(false); }
 };

 if (!company) return <div className="animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}</div>;

 return (
 <div className="max-w-3xl mx-auto space-y-5">
 <Card className="p-6">
 <div className="flex items-start gap-5">
 <div className="relative inline-block">
 <div className="relative group cursor-pointer" {...getRootProps()}>
 <Avatar src={getFileUrl(company.logo)} name={company.name} size="xl" />
 <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
 <input {...getInputProps()} />
 <Upload size={20} className="text-white" />
 </div>
 <div className="absolute bottom-0 right-0 bg-primary-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm pointer-events-none">
 <Edit2 size={14} />
 </div>
 </div>
 {company.logo && (
 <button
 onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }}
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
 <h2 className="text-xl font-bold text-gray-900 ">{company.name}</h2>
 {company.industry && <p className="text-gray-500 text-sm">{company.industry}</p>}
 {company.location && <p className="text-sm text-gray-400 flex items-center gap-1 mt-1"><MapPin size={13} />{company.location}</p>}
 </div>
 <Button variant="secondary" size="sm" onClick={() => setEditing(true)}><Edit2 size={14} /> Edit</Button>
 </div>
 <div className="flex gap-4 mt-3 text-sm text-gray-500">
 {company.size && <span className="flex items-center gap-1"><Users size={14} />{company.size} employees</span>}
 {company.foundedYear && <span className="flex items-center gap-1">Est. {company.foundedYear}</span>}
 {company.website && <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline"><Globe size={14} />Website</a>}
 </div>
 </div>
 </div>
 {company.description && (
 <div className="mt-4 pt-4 border-t border-gray-100">
 <p className="text-sm text-gray-600 leading-relaxed">{company.description}</p>
 </div>
 )}
 {(company.hrName || company.address || company.city) && (
 <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
 <div>
 <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">HR Contact</h4>
 <p className="text-sm font-medium text-gray-900">{company.hrName || 'Not specified'}</p>
 {company.hrDesignation && <p className="text-xs text-gray-500">{company.hrDesignation}</p>}
 </div>
 <div>
 <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Address</h4>
 <p className="text-sm text-gray-600">
 {company.address && <span className="block">{company.address}</span>}
 {[company.city, company.state, company.country].filter(Boolean).join(', ')}
 </p>
 </div>
 </div>
 )}
 </Card>

 {editing && (
 <Card className="p-5">
 <h3 className="font-semibold mb-4">Edit Company Profile</h3>
 <div className="space-y-4">
 <Input label="Company Name" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
 <Textarea label="Description" rows={3} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
 <div className="grid grid-cols-2 gap-3">
 <Input label="Industry" value={form.industry || ''} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))} />
 <Select label="Company Size" value={form.size || ''} onChange={e => setForm(p => ({ ...p, size: e.target.value }))}>
 <option value="">Select size</option>
 {['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'].map(s => <option key={s} value={s}>{s}</option>)}
 </Select>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <Input label="Founded Year" type="number" value={form.foundedYear || ''} onChange={e => setForm(p => ({ ...p, foundedYear: e.target.value }))} />
 <Input label="Website" value={form.website || ''} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} />
 </div>
 
 <h4 className="font-medium text-gray-900 border-b pb-2 mt-4">Address Details</h4>
 <Input label="Address" value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
 <div className="grid grid-cols-3 gap-3">
 <Input label="City" value={form.city || ''} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
 <Input label="State" value={form.state || ''} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} />
 <Input label="Country" value={form.country || ''} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} />
 </div>

 <h4 className="font-medium text-gray-900 border-b pb-2 mt-4">HR Contact</h4>
 <div className="grid grid-cols-2 gap-3">
 <Input label="HR Name" value={form.hrName || ''} onChange={e => setForm(p => ({ ...p, hrName: e.target.value }))} />
 <Input label="Designation" value={form.hrDesignation || ''} onChange={e => setForm(p => ({ ...p, hrDesignation: e.target.value }))} />
 </div>

 <div className="flex gap-3 pt-4">
 <Button onClick={save} loading={saving} className="flex-1">Save Changes</Button>
 <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
 </div>
 </div>
 </Card>
 )}
 </div>
 );
}
