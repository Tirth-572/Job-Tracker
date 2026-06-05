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

  if (loading) return <div className="animate-pulse h-64 bg-gray-200 rounded-xl" />;

  const name = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim();

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Card className="p-6">
        <div className="flex items-start gap-5">
          <Avatar src={getFileUrl(user.avatar)} name={name || 'Admin'} size="xl" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{name || 'Admin User'}</h2>
                <p className="text-primary-600 font-medium text-sm mt-0.5">{profile?.designation || 'System Administrator'}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                  {user.phone && <span className="flex items-center gap-1"><Phone size={14} /> {user.phone}</span>}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                <Edit2 size={14} /> Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {editing && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Edit Admin Profile</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" value={form.firstName || ''} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
              <Input label="Last Name" value={form.lastName || ''} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
            </div>
            <Input label="Designation" value={form.designation || ''} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} />
            
            <div className="flex gap-3 pt-2">
              <Button onClick={saveProfile} loading={saving} className="flex-1">Save Changes</Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-semibold mb-4 text-gray-900">System Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-500 flex items-center gap-2 mb-1"><ShieldCheck size={14} /> Account Status</p>
            <p className="font-medium text-green-600">Active (Full Permissions)</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-500 flex items-center gap-2 mb-1"><Calendar size={14} /> Member Since</p>
            <p className="font-medium text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
