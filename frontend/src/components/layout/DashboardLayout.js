import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Briefcase, FileText, MessageSquare, Bell,
    Settings, LogOut, Menu, X, Search, Users, Building2,
    BarChart3, Sparkles, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Avatar, Button, Modal } from '../ui';
import { cn, formatRelativeDate, getFileUrl } from '../../lib/utils';
import SupportChatWidget from '../shared/SupportChatWidget';
import toast from 'react-hot-toast';

const NAV_ITEMS = {
    CANDIDATE: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/candidate/dashboard' },
        { label: 'Browse Jobs', icon: Briefcase, path: '/candidate/jobs' },
        { label: 'Applications', icon: FileText, path: '/candidate/applications' },
        { label: 'Messages', icon: MessageSquare, path: '/candidate/chat' },
        { label: 'Settings', icon: Settings, path: '/settings' },
    ],
    COMPANY: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/company/dashboard' },
        { label: 'Jobs', icon: Briefcase, path: '/company/jobs' },
        { label: 'Applications', icon: FileText, path: '/company/applications' },
        { label: 'Pipeline', icon: BarChart3, path: '/company/pipeline' },
        { label: 'Workflows', icon: Sparkles, path: '/company/workflows' },
        { label: 'Settings', icon: Settings, path: '/settings' },
    ],
    ADMIN: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
        { label: 'Jobs', icon: Briefcase, path: '/admin/jobs' },
        { label: 'Users', icon: Users, path: '/admin/users' },
        { label: 'Companies', icon: Building2, path: '/admin/companies' },
        { label: 'Support', icon: MessageSquare, path: '/admin/support' },
        { label: 'Settings', icon: Settings, path: '/settings' },
    ],
};

// ── Notification Panel ────────────────────────────────────────────────────────
const NotificationsPanel = ({ onClose }) => {
    const { notifications, markRead, markAllRead } = useNotifications();
    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-brand-surface rounded-2xl border border-brand-primary/20 shadow-card-hover z-50 overflow-hidden backdrop-blur-md"
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-primary/10">
                <span className="font-semibold text-sm text-gray-900">Notifications</span>
                <button
                    onClick={markAllRead}
                    className="text-xs text-brand-primary hover:text-brand-secondary font-semibold transition-colors"
                >
                    Mark all read
                </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-brand-bg">
                {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                        <Bell size={22} className="text-brand-secondary mx-auto mb-2" />
                        <p className="text-sm text-gray-500">All caught up!</p>
                    </div>
                ) : (
                    notifications.slice(0, 10).map(n => (
                        <button
                            key={n.id}
                            onClick={() => markRead(n.id)}
                            className={cn(
                                'w-full text-left px-4 py-3 hover:bg-brand-bg transition-colors',
                                !n.isRead && 'bg-brand-primary/5'
                            )}
                        >
                            <div className="flex items-start gap-2.5">
                                <div className={cn(
                                    'w-2 h-2 rounded-full mt-1.5 shrink-0',
                                    !n.isRead ? 'bg-brand-primary' : 'bg-transparent'
                                )} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 leading-snug">{n.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{formatRelativeDate(n.createdAt)}</p>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </motion.div>
    );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navItems = NAV_ITEMS[user?.role] || [];
    const [signOutModal, setSignOutModal] = useState(false);

    const name = user?.candidate
        ? `${user.candidate.firstName} ${user.candidate.lastName}`
        : user?.company?.name || user?.email;
    const avatar = user?.candidate?.avatar || user?.company?.logo;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-20 lg:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={{ x: isOpen ? 0 : -280 }}
                transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                className={cn(
                    'fixed left-0 top-0 h-full w-64 z-30 flex flex-col',
                    'bg-brand-surface border-r border-brand-primary/10',
                    'lg:translate-x-0 lg:static lg:z-auto'
                )}
                style={{ transform: typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'none' : undefined }}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-brand-primary/10 shrink-0">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center shadow-brand">
                            <span className="text-white font-bold text-sm">H</span>
                        </div>
                        <span className="font-bold text-gray-900 text-lg tracking-tight">HireBridge</span>
                    </Link>
                    <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-brand-bg text-gray-500 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    <div className="mb-4 px-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Menu</span>
                    </div>
                    {navItems.map(({ label, icon: Icon, path }) => {
                        const isActive = location.pathname.startsWith(path);
                        return (
                            <Link
                                key={path}
                                to={path}
                                onClick={onClose}
                                className={cn('sidebar-link group', isActive && 'active')}
                            >
                                <Icon size={18} className={cn('relative z-10 shrink-0 transition-colors', isActive ? 'text-white' : 'text-gray-500 group-hover:text-brand-primary')} />
                                <span className="relative z-10 flex-1">{label}</span>
                                {isActive && <ChevronRight size={14} className="relative z-10 text-white/70" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* User strip */}
                <div className="p-4 border-t border-brand-primary/10 shrink-0">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-brand-bg transition-colors group cursor-pointer border border-transparent hover:border-brand-primary/20">
                        <Avatar src={getFileUrl(avatar)} name={name} size="sm" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate leading-tight">{name}</p>
                            <p className="text-xs text-gray-500 capitalize font-medium">{user?.role?.toLowerCase()}</p>
                        </div>
                        <button
                            onClick={(e) => { e.preventDefault(); setSignOutModal(true); }}
                            className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Sign out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </motion.aside>

            <Modal isOpen={signOutModal} onClose={() => setSignOutModal(false)} title="Sign Out" size="sm">
                <div className="space-y-6 pt-2">
                    <p className="text-gray-600 text-center text-sm font-medium">Are you sure you want to sign out of HireBridge?</p>
                    <div className="flex gap-3">
                        <Button variant="ghost" className="flex-1" onClick={() => setSignOutModal(false)}>Cancel</Button>
                        <Button variant="primary" className="flex-1 bg-red-500 hover:bg-red-600 shadow-none hover:shadow-none" onClick={() => { setSignOutModal(false); logout(); }}>Sign Out</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

// ── DashboardLayout ───────────────────────────────────────────────────────────
export default function DashboardLayout({ children }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { unreadCount } = useNotifications();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            if (user?.role === 'CANDIDATE') {
                navigate('/candidate/jobs', { state: { search: searchQuery.trim() } });
            } else if (user?.role === 'COMPANY') {
                toast('Employer search is coming soon!', { icon: '🔍' });
            }
        }
    };

    const name = user?.candidate
        ? `${user.candidate.firstName} ${user.candidate.lastName}`
        : user?.company?.name || user?.email;
    const avatar = user?.candidate?.avatar || user?.company?.logo;

    return (
        <div className="flex h-screen overflow-hidden bg-brand-bg">
            {/* Desktop sidebar */}
            <div className="hidden lg:flex shrink-0">
                <Sidebar isOpen={true} onClose={() => { }} />
            </div>
            {/* Mobile sidebar */}
            <div className="lg:hidden">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Topbar */}
                <header className="h-16 glass border-b border-brand-primary/10 flex items-center px-6 gap-4 shrink-0 sticky top-0 z-10">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 hover:bg-brand-surface rounded-xl text-gray-600 transition-colors"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Search */}
                    <div className="hidden md:flex items-center flex-1 max-w-sm px-4 py-2 bg-brand-surface border border-brand-primary/20 rounded-2xl focus-within:border-brand-primary gap-3 transition-all duration-300">
                        <Search size={16} className="text-gray-400 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search anywhere..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            className="bg-transparent border-none outline-none w-full text-sm text-gray-900 placeholder-gray-400"
                        />
                    </div>

                    <div className="flex-1" />

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setNotifOpen(p => !p)}
                            className={cn(
                                'relative p-2.5 rounded-xl transition-all duration-300',
                                notifOpen ? 'bg-brand-primary text-white shadow-soft' : 'text-gray-500 hover:bg-brand-surface hover:text-brand-primary'
                            )}
                        >
                            <Bell size={18} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-brand-bg">
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

                    {/* Profile */}
                    <Link
                        to="/profile"
                        className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-brand-surface transition-colors group border border-transparent hover:border-brand-primary/20"
                    >
                        <Avatar src={getFileUrl(avatar)} name={name} size="sm" />
                        <div className="hidden sm:block text-left">
                            <p className="text-xs font-bold text-gray-900 leading-tight group-hover:text-brand-primary transition-colors">
                                {name?.split(' ')[0]}
                            </p>
                            <p className="text-[10px] text-gray-500 capitalize font-medium">{user?.role?.toLowerCase()}</p>
                        </div>
                    </Link>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto page-enter">
                    <div className="p-6 lg:p-10 max-w-screen-2xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            {user?.role !== 'ADMIN' && <SupportChatWidget />}
        </div>
    );
}
