import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const STATUS_CONFIG = {
  APPLIED:              { label: 'Applied',              color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  UNDER_REVIEW:         { label: 'Under Review',         color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  SHORTLISTED:          { label: 'Shortlisted',          color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  INTERVIEW_SCHEDULED:  { label: 'Interview Scheduled',  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  INTERVIEW_COMPLETED:  { label: 'Interview Completed',  color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  SELECTED:             { label: 'Selected',             color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  OFFER_SENT:           { label: 'Offer Sent',           color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  JOINED:               { label: 'Joined',               color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  REJECTED:             { label: 'Rejected',             color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export const JOB_TYPE_CONFIG = {
  FULL_TIME:   { label: 'Full Time',   color: 'bg-blue-100 text-blue-700' },
  PART_TIME:   { label: 'Part Time',   color: 'bg-purple-100 text-purple-700' },
  CONTRACT:    { label: 'Contract',    color: 'bg-amber-100 text-amber-700' },
  INTERNSHIP:  { label: 'Internship',  color: 'bg-green-100 text-green-700' },
  REMOTE:      { label: 'Remote',      color: 'bg-cyan-100 text-cyan-700' },
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
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return 'Salary not disclosed';
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
