import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, FileText, MessageSquare, Bell, Settings,
  LogOut, Moon, Sun, Menu, X, ChevronDown, Search, Users, Building2,
  BarChart3, Shield, BookmarkCheck, UserCircle, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { Avatar } from '../ui';
import { cn, formatRelativeDate } from '../../lib/utils';

const NAV_ITEMS = {
  CANDIDATE: [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/candidate/dashboard' },
    { label: 'Browse Jobs',   icon: Search,          path: '/candidate/jobs' },
    { label: 'Applications',  icon: FileText,        path: '/candidate/applications' },
    { label: 'Saved Jobs',    icon: BookmarkCheck,   path: '/candidate/saved' },
    { label: 'Messages',      icon: MessageSquare,   path: '/candidate/chat' },
    { label: 'Profile',       icon: UserCircle,      path: '/candidate/profile' },
  ],
  COMPANY: [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/company/dashboard' },
    { label: 'Job Posts',     icon: Briefcase,       path: '/company/jobs' },
    { label: 'Applications',  icon: FileText,        path: '/company/applications' },
    { label: 'Pipeline',      icon: Calendar,        path: '/company/pipeline' },
    { label: 'Messages',      icon: MessageSquare,   path: '/company/chat' },
    { label: 'Profile',       icon: Building2,       path: '/company/profile' },
  ],
  ADMIN: [
    { label: 'Dashboard',     icon: BarChart3,       path: '/admin/dashboard' },
    { label: 'Users',         icon: Users,           path: '/admin/users' },
    { label: 'Companies',     icon: Building2,       path: '/admin/companies' },
    { label: 'Jobs',          icon: Briefcase,       path: '/admin/jobs' },
    { label: 'Email Logs',    icon: FileText,        path: '/admin/email-logs' },
  ],
};

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navItems = NAV_ITEMS[user?.role] || [];

  const name = user?.candidate
    ? `${user.candidate.firstName} ${user.candidate.lastName}`
    : user?.company?.name || user?.email;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -280 }}
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 flex flex-col',
          'lg:translate-x-0 lg:static lg:z-auto'
        )}
        style={{ transform: typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'none' : undefined }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">TalentFlow</p>
            <p className="text-xs text-gray-400">ATS Platform</p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ label, icon: Icon, path }) => (
            <Link
              key={path}
              to={path}
              onClick={onClose}
              className={cn('sidebar-link', location.pathname.startsWith(path) && 'active')}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
          <button onClick={toggleTheme} className="sidebar-link w-full">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={logout} className="sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </motion.aside>
    </>
  );
};

const NotificationsPanel = ({ onClose }) => {
  const { notifications, markRead, markAllRead } = useNotifications();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      className="absolute right-0 top-full mt-2 w-80 card shadow-xl z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <span className="font-semibold text-sm">Notifications</span>
        <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline">Mark all read</button>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No notifications</p>
        ) : (
          notifications.slice(0, 10).map(n => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={cn('w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors', !n.isRead && 'bg-primary-50/50 dark:bg-primary-900/10')}
            >
              {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary-600 float-right mt-1.5" />}
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{formatRelativeDate(n.createdAt)}</p>
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
};

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const name = user?.candidate
    ? `${user.candidate.firstName} ${user.candidate.lastName}`
    : user?.company?.name || user?.email;

  const avatar = user?.candidate?.avatar || user?.company?.logo;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="hidden lg:flex">
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>
      <div className="lg:hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <Menu size={20} className="text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(prev => !prev)}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Bell size={20} className="text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="relative z-50">
                    <NotificationsPanel onClose={() => setNotifOpen(false)} />
                  </div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User */}
          <div className="flex items-center gap-2">
            <Avatar src={avatar} name={name} size="sm" />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-none">{name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.role}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
