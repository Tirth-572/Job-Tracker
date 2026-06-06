import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

const BACKEND_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
export const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BACKEND_URL}${path}`;
};

// ── Teal-based status colors ──────────────────────────────────────────────────
export const STATUS_CONFIG = {
  APPLIED: { label: 'Applied', color: 'bg-[#CBF1F5] text-[#357B7E] border-[#A6E3E9]' },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  SHORTLISTED: { label: 'Shortlisted', color: 'bg-[#A6E3E9]/30 text-[#4A9699] border-[#A6E3E9]' },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  INTERVIEW_COMPLETED: { label: 'Interview Completed', color: 'bg-[#CBF1F5] text-[#357B7E] border-[#A6E3E9]' },
  SELECTED: { label: 'Selected', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  OFFER_SENT: { label: 'Offer Sent', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  JOINED: { label: 'Joined', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  REJECTED: { label: 'Rejected', color: 'bg-red-50 text-red-600 border-red-100' },
};

export const JOB_TYPE_CONFIG = {
  FULL_TIME: { label: 'Full Time', color: 'bg-[#CBF1F5] text-[#357B7E] border-[#A6E3E9]' },
  PART_TIME: { label: 'Part Time', color: 'bg-purple-50 text-purple-700 border-purple-100' },
  CONTRACT: { label: 'Contract', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  INTERNSHIP: { label: 'Internship', color: 'bg-[#A6E3E9]/30 text-[#4A9699] border-[#A6E3E9]' },
  REMOTE: { label: 'Remote', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatRelativeDate = (date) => {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(date);
};

export const formatSalary = (min, max, currency = 'USD') => {
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return 'Salary not disclosed';
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};
