import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { Card, Button, Input } from '../../components/ui';
import toast from 'react-hot-toast';
import { Shield, Bell, Lock, Mail, Phone, Eye } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState(query.get('tab') || 'general');

  const [emailForm, setEmailForm] = useState({ email: user?.email || '', currentPassword: '' });
  const [phoneForm, setPhoneForm] = useState({ phone: user?.phone || '', currentPassword: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [settingsForm, setSettingsForm] = useState({
    emailNotifications: user?.emailNotifications ?? true,
    pushNotifications: user?.pushNotifications ?? true,
    profileVisibility: user?.profileVisibility || 'PUBLIC'
  });

  const [loading, setLoading] = useState(false);

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.updateEmail(emailForm);
      toast.success(data.message || 'Email updated');
      setEmailForm(p => ({ ...p, currentPassword: '' }));
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.updatePhone(phoneForm);
      toast.success(data.message || 'Phone updated');
      setPhoneForm(p => ({ ...p, currentPassword: '' }));
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update phone');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    setLoading(true);
    try {
      await authAPI.changePassword({ 
        currentPassword: passwordForm.currentPassword, 
        newPassword: passwordForm.newPassword 
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    setLoading(true);
    try {
      await authAPI.updateSettings(settingsForm);
      toast.success('Preferences saved');
      refreshUser();
    } catch (err) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Shield },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    ...(user?.role !== 'ADMIN' ? [{ id: 'privacy', label: 'Privacy', icon: Eye }] : []),
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
      {/* Sidebar Navigation */}
      <Card className="w-full md:w-64 shrink-0 p-3 h-fit space-y-1">
        <h2 className="px-3 text-lg font-semibold text-gray-900 mb-3">Settings</h2>
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={18} className={activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'} />
              {tab.label}
            </button>
          );
        })}
      </Card>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {activeTab === 'general' && (
          <>
            <Card className="p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Mail size={18} /> Email Address</h3>
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <Input 
                  label="New Email Address" 
                  type="email" 
                  required 
                  value={emailForm.email} 
                  onChange={e => setEmailForm(p => ({ ...p, email: e.target.value }))} 
                />
                <Input 
                  label="Current Password (required to verify)" 
                  type="password" 
                  value={emailForm.currentPassword} 
                  onChange={e => setEmailForm(p => ({ ...p, currentPassword: e.target.value }))} 
                />
                <Button type="submit" loading={loading}>Update Email</Button>
              </form>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Phone size={18} /> Phone Number</h3>
              <form onSubmit={handleUpdatePhone} className="space-y-4">
                <Input 
                  label="New Phone Number" 
                  type="tel" 
                  required 
                  value={phoneForm.phone} 
                  onChange={e => setPhoneForm(p => ({ ...p, phone: e.target.value }))} 
                />
                <Input 
                  label="Current Password (required to verify)" 
                  type="password" 
                  value={phoneForm.currentPassword} 
                  onChange={e => setPhoneForm(p => ({ ...p, currentPassword: e.target.value }))} 
                />
                <Button type="submit" loading={loading}>Update Phone</Button>
              </form>
            </Card>
          </>
        )}

        {activeTab === 'security' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Lock size={18} /> Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input 
                label="Current Password" 
                type="password" 
                required 
                value={passwordForm.currentPassword} 
                onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))} 
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="New Password" 
                  type="password" 
                  required 
                  value={passwordForm.newPassword} 
                  onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} 
                />
                <Input 
                  label="Confirm New Password" 
                  type="password" 
                  required 
                  value={passwordForm.confirmPassword} 
                  onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} 
                />
              </div>
              <Button type="submit" loading={loading}>Update Password</Button>
            </form>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Bell size={18} /> Notification Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-500 mt-0.5">Receive updates, offers, and messages via email</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settingsForm.emailNotifications}
                  onChange={e => setSettingsForm(p => ({ ...p, emailNotifications: e.target.checked }))}
                  className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
                />
              </label>
              
              <label className="flex items-center justify-between cursor-pointer p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-500 mt-0.5">Receive real-time alerts in your browser</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settingsForm.pushNotifications}
                  onChange={e => setSettingsForm(p => ({ ...p, pushNotifications: e.target.checked }))}
                  className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
                />
              </label>

              <Button onClick={handleUpdateSettings} loading={loading} className="mt-4">Save Preferences</Button>
            </div>
          </Card>
        )}

        {activeTab === 'privacy' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><Eye size={18} /> Privacy Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Profile Visibility</label>
                <select 
                  className="input mt-1"
                  value={settingsForm.profileVisibility}
                  onChange={e => setSettingsForm(p => ({ ...p, profileVisibility: e.target.value }))}
                >
                  <option value="PUBLIC">Public (Visible to companies and search)</option>
                  <option value="PRIVATE">Private (Only visible when you apply)</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  When private, your profile will not appear in recruiter searches.
                </p>
              </div>

              <Button onClick={handleUpdateSettings} loading={loading} className="mt-4">Save Privacy Settings</Button>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
