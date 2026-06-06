import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { Card, Button, Input, Avatar } from '../../components/ui';
import toast from 'react-hot-toast';
import { Edit2, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';
import { getFileUrl } from '../../lib/utils';

export default function AdminProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminAPI.getProfile().then(({ data }) => {
      setProfile(data);
      setForm(data);
    }).finally(() => setLoading(false));
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await adminAPI.updateProfile(form);
      setProfile(data);
      setEditing(false);
      toast.success('Admin profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-brand-primary/10 rounded-2xl" />;

  const name = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="flex items-start gap-5">
          <Avatar src={getFileUrl(user.avatar)} name={name || 'Admin'} size="xl" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{name || 'Admin User'}</h2>
                <p className="text-brand-primary font-bold text-sm mt-1">{profile?.designation || 'System Administrator'}</p>
                <div className="flex items-center gap-4 mt-3 text-sm font-medium text-gray-500">
                  <span className="flex items-center gap-1.5"><Mail size={16} /> {user.email}</span>
                  {user.phone && <span className="flex items-center gap-1.5"><Phone size={16} /> {user.phone}</span>}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                <Edit2 size={14} className="mr-1.5" /> Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {editing && (
        <Card className="p-6 border border-brand-primary/20">
          <h3 className="font-bold mb-5 text-gray-900">Edit Admin Profile</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={form.firstName || ''} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
              <Input label="Last Name" value={form.lastName || ''} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
            </div>
            <Input label="Designation" value={form.designation || ''} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} />
            
            <div className="flex gap-4 pt-4 border-t border-brand-primary/10">
              <button onClick={saveProfile} disabled={saving} className="btn-primary flex-1">Save Changes</button>
              <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-bold mb-5 text-gray-900">System Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-brand-surface rounded-2xl border border-brand-primary/20 shadow-sm">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2"><ShieldCheck size={16} /> Account Status</p>
            <p className="font-bold text-green-500">Active (Full Permissions)</p>
          </div>
          <div className="p-4 bg-brand-surface rounded-2xl border border-brand-primary/20 shadow-sm">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2"><Calendar size={16} /> Member Since</p>
            <p className="font-bold text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
