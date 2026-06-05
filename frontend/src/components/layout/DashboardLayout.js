import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Briefcase, FileText, MessageSquare, Bell, Settings,
    LogOut, Moon, Sun, Menu, X, Search, Users, Building2,
    BarChart3, BookmarkCheck, UserCircle, Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { Avatar } from '../ui';
import { cn, formatRelativeDate, getFileUrl } from '../../lib/utils';
import SupportChatWidget from '../shared/SupportChatWidget';
import { Button, Modal } from '../ui';

const NAV_ITEMS = {
    CANDIDATE: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/candidate/dashboard' },
        { label: 'Jobs', icon: Briefcase, path: '/candidate/jobs' },
        { label: 'Applications', icon: FileText, path: '/candidate/applications' },
        { label: 'Messages', icon: MessageSquare, path: '/candidate/chat' },
        { label: 'Settings', icon: Settings, path: '/settings' },
    ],
    COMPANY: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/company/dashboard' },
        { label: 'Jobs', icon: Briefcase, path: '/company/jobs' },
        { label: 'Applications', icon: FileText, path: '/company/applications' },
        { label: 'Workflows', icon: Settings, path: '/company/workflows' },
        { label: 'Settings', icon: Settings, path: '/settings' },
    ],
    ADMIN: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
        { label: 'Jobs', icon: Briefcase, path: '/admin/jobs' },
        { label: 'Applications', icon: FileText, path: '/admin/dashboard' },
        { label: 'Messages', icon: MessageSquare, path: '/admin/support' },
        { label: 'Settings', icon: Settings, path: '/settings' },
    ],
};

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navItems = NAV_ITEMS[user?.role] || [];



    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
            )}
            <motion.aside
                initial={false}
                animate={{ x: isOpen ? 0 : -280 }}
                className={cn(
                    'fixed left-0 top-0 h-full w-64 bg-[#FFFFFF] border-r border-[#E2E8F0] z-30 flex flex-col',
                    'lg:translate-x-0 lg:static lg:z-auto'
                )}
                style={{ transform: typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'none' : undefined }}
            >
                {/* Logo */}
                <div className="h-24 flex items-center px-6 border-b border-[#E2E8F0]">
                    <img src="/logo.png" alt="HireBridge" className="h-20 w-48 object-contain rounded-lg p-1" />
                    <button onClick={onClose} className="ml-auto lg:hidden p-1 hover:bg-[#F8FAFC] rounded-lg">
                        <X size={16} className="text-[#64748B]" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {navItems.map(({ label, icon: Icon, path, action }) => {
                        if (action === 'notif') {
                            return (
                                <button
                                    key={label}
                                    onClick={() => {
                                        const event = new CustomEvent('toggleNotifications');
                                        window.dispatchEvent(event);
                                        if (window.innerWidth < 1024) onClose();
                                    }}
                                    className="sidebar-link w-full justify-start"
                                >
                                    <Icon size={18} />
                                    {label}
                                </button>
                            );
                        }
                        return (
                            <Link
                                key={path}
                                to={path}
                                onClick={onClose}
                                className={cn('sidebar-link', location.pathname.startsWith(path) && 'active')}
                            >
                                <Icon size={18} />
                                {label}
                            </Link>
                        );
                    })}
                </nav>
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
                <span className="font-semibold text-sm text-[#0F172A]">Notifications</span>
                <button onClick={markAllRead} className="text-xs text-[#635BFF] hover:underline">Mark all read</button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8F0]">
                {notifications.length === 0 ? (
                    <p className="text-sm text-[#64748B] text-center py-8">No notifications</p>
                ) : (
                    notifications.slice(0, 10).map(n => (
                        <button
                            key={n.id}
                            onClick={() => markRead(n.id)}
                            className={cn('w-full text-left px-4 py-3 hover:bg-[#F8FAFC] transition-colors', !n.isRead && 'bg-[#635BFF]/5')}
                        >
                            {!n.isRead && <div className="w-2 h-2 rounded-full bg-[#635BFF] float-right mt-1.5" />}
                            <p className="text-sm font-medium text-[#0F172A]">{n.title}</p>
                            <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-xs text-[#64748B] mt-1">{formatRelativeDate(n.createdAt)}</p>
                        </button>
                    ))
                )}
            </div>
        </motion.div>
    );
};

const DashboardLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [signOutModalOpen, setSignOutModalOpen] = useState(false);

    React.useEffect(() => {
        const handleNotifToggle = () => setNotifOpen(prev => !prev);
        window.addEventListener('toggleNotifications', handleNotifToggle);
        return () => window.removeEventListener('toggleNotifications', handleNotifToggle);
    }, []);

    const name = user?.candidate
        ? `${user.candidate.firstName} ${user.candidate.lastName}`
        : user?.company?.name || user?.email;

    const avatar = user?.candidate?.avatar || user?.company?.logo;

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
            <div className="hidden lg:flex">
                <Sidebar isOpen={true} onClose={() => { }} />
            </div>
            <div className="lg:hidden">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top bar */}
                <header className="h-16 bg-[#FFFFFF] border-b border-[#E2E8F0] flex items-center px-4 gap-3 shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 hover:bg-[#F8FAFC] rounded-lg"
                    >
                        <Menu size={20} className="text-[#64748B]" />
                    </button>

                    {/* Search Bar */}
                    <div className="hidden md:flex items-center flex-1 max-w-md px-3 py-2 ml-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus-within:border-[#635BFF] focus-within:ring-4 focus-within:ring-[#635BFF]/20 transition-all">
                        <Search size={18} className="text-[#64748B] mr-2" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent border-none outline-none w-full text-sm text-[#0F172A] placeholder-[#64748B]"
                        />
                    </div>

                    <div className="flex-1" />

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setNotifOpen(prev => !prev)}
                            className="relative p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors"
                        >
                            <Bell size={20} className="text-[#64748B]" />
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

                    {/* User Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setProfileDropdownOpen(prev => !prev)}
                            className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F8FAFC] transition-colors focus:outline-none"
                        >
                            <Avatar src={getFileUrl(avatar)} name={name} size="sm" />
                            <div className="hidden sm:block text-left mr-1">
                                <p className="text-sm font-medium text-[#0F172A] leading-none">{name}</p>
                                <p className="text-xs text-[#64748B] mt-0.5 capitalize">{user?.role?.toLowerCase()}</p>
                            </div>
                        </button>

                        <AnimatePresence>
                            {profileDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-56 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl shadow-xl z-50 overflow-hidden py-2"
                                    >
                                        <Link to="/profile" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">
                                            <UserCircle size={16} /> My Profile
                                        </Link>
                                        <Link to="/settings" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">
                                            <Settings size={16} /> Account Settings
                                        </Link>
                                        <button onClick={() => { setProfileDropdownOpen(false); setNotifOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">
                                            <Bell size={16} /> Notifications
                                        </button>
                                        <Link to="/support" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">
                                            <MessageSquare size={16} /> Help & Support
                                        </Link>
                                        <div className="h-px bg-[#E2E8F0] my-1" />
                                        <button onClick={() => { setProfileDropdownOpen(false); setSignOutModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 transition-colors">
                                            <LogOut size={16} /> Sign Out
                                        </button>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>

            {user?.role !== 'ADMIN' && <SupportChatWidget />}

            <Modal isOpen={signOutModalOpen} onClose={() => setSignOutModalOpen(false)} title="Sign Out" size="sm">
                <div className="space-y-6">
                    <p className="text-[#475569] text-center">Are you sure you want to sign out?</p>
                    <div className="flex gap-3">
                        <Button variant="secondary" className="flex-1" onClick={() => setSignOutModalOpen(false)}>Cancel</Button>
                        <Button variant="danger" className="flex-1" onClick={() => { setSignOutModalOpen(false); logout(); }}>Sign Out</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DashboardLayout;
