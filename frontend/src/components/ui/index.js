import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2, X, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Button
export const Button = ({ children, variant = 'primary', size = 'md', loading, className, ...props }) => {
const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed';
 const variants = {
 primary: 'bg-[#635BFF] text-white hover:bg-[#5146E5] hover:scale-105 active:scale-[0.98] shadow-sm hover:shadow-lg hover:-translate-y-0.5',
 secondary: 'bg-[#06B6D4] text-white hover:bg-[#0891b2] hover:scale-105 active:scale-[0.98] shadow-sm hover:shadow-lg hover:-translate-y-0.5',
 danger: 'bg-red-50 text-[#EF4444] hover:bg-red-100 hover:scale-105 active:scale-[0.98] shadow-sm hover:shadow-lg hover:-translate-y-0.5',
 ghost: 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]',
 outline: 'border border-[#E2E8F0] text-[#64748B] hover:border-[#635BFF] hover:bg-[#F8FAFC]',
 };
 const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };

 return (
 <button className={cn(base, variants[variant], sizes[size], className)} disabled={loading || props.disabled} {...props}>
 {loading && <Loader2 size={16} className="animate-spin" />}
 {children}
 </button>
 );
};

// Badge
export const Badge = ({ children, className, ...props }) => (
 <span className={cn('badge', className)} {...props}>{children}</span>
);

// Card
export const Card = ({ children, className, ...props }) => (
 <div className={cn('card', className)} {...props}>{children}</div>
);

export const Input = React.forwardRef(({ label, error, className, type, ...props }, ref) => {
 const [showPassword, React_useState] = React.useState(false);
 const isPassword = type === 'password';
 const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

 return (
 <div className="w-full">
 {label && <label className="label">{label}</label>}
 <div className="relative">
 <input 
 ref={ref} 
 type={inputType}
 className={cn('input', isPassword && 'pr-10', error && 'border-red-500 focus:ring-red-500', className)} 
 {...props} 
 />
 {isPassword && (
 <button
 type="button"
 className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] transition-colors"
 onClick={() => React_useState(!showPassword)}
 tabIndex={-1}
 >
 {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
 </button>
 )}
 </div>
 {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
 </div>
 );
});

// Textarea
export const Textarea = React.forwardRef(({ label, error, className, ...props }, ref) => (
 <div className="w-full">
 {label && <label className="label">{label}</label>}
 <textarea ref={ref} className={cn('input resize-none', error && 'border-red-500', className)} {...props} />
 {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
 </div>
));

// Select
export const Select = React.forwardRef(({ label, error, children, className, ...props }, ref) => (
 <div className="w-full">
 {label && <label className="label">{label}</label>}
 <select ref={ref} className={cn('input', error && 'border-red-500', className)} {...props}>
 {children}
 </select>
 {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
 </div>
));

// Modal
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
 const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };
 return (
 <AnimatePresence>
 {isOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/60 backdrop-blur-sm"
 onClick={onClose}
 />
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 16 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 16 }}
 transition={{ type: 'spring', stiffness: 300, damping: 30 }}
 className={cn('relative w-full rounded-2xl flex flex-col shadow-2xl', sizes[size])}
 style={{ maxHeight: '90vh', background: '#FFFFFF', border: '1px solid #E2E8F0' }}
 >
 {title && (
 <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] shrink-0">
 <h3 className="text-lg font-semibold text-[#0F172A]">{title}</h3>
 <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition-colors">
 <X size={18} />
 </button>
 </div>
 )}
 <div className="p-6 overflow-y-auto flex-1 text-[#0F172A]">{children}</div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 );
};

// Skeleton
export const Skeleton = ({ className }) => <div className={cn('skeleton', className)} />;

export const SkeletonCard = () => (
 <Card className="p-4 space-y-3">
 <div className="flex items-center gap-3">
 <Skeleton className="w-12 h-12 rounded-lg" />
 <div className="flex-1 space-y-2">
 <Skeleton className="h-4 w-3/4" />
 <Skeleton className="h-3 w-1/2" />
 </div>
 </div>
 <Skeleton className="h-3 w-full" />
 <Skeleton className="h-3 w-5/6" />
 <div className="flex gap-2">
 <Skeleton className="h-6 w-20 rounded-full" />
 <Skeleton className="h-6 w-20 rounded-full" />
 </div>
 </Card>
);

// Avatar
export const Avatar = ({ src, name, size = 'md', className }) => {
 const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-xl' };
 const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
 return src ? (
 <img src={src} alt={name} className={cn('rounded-full object-cover', sizes[size], className)} />
 ) : (
 <div className={cn('rounded-full bg-[#635BFF]/10 border border-[#635BFF]/20 text-[#635BFF] font-semibold flex items-center justify-center', sizes[size], className)}>
 {initials}
 </div>
 );
};

// Empty State
export const EmptyState = ({ icon: Icon, title, description, action }) => (
 <div className="flex flex-col items-center justify-center py-16 text-center">
 {Icon && (
 <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center mb-4">
 <Icon size={32} className="text-[#64748B]" />
 </div>
 )}
 <h3 className="text-lg font-semibold text-[#0F172A] mb-1">{title}</h3>
 {description && <p className="text-sm text-[#64748B] max-w-sm mb-6">{description}</p>}
 {action}
 </div>
);

// Stat Card
export const StatCard = ({ icon: Icon, label, value, trend, color = 'primary' }) => {
 const colors = {
 primary: 'bg-[#635BFF]/10 text-[#635BFF]',
 green: 'bg-[#22C55E]/10 text-[#22C55E]',
 amber: 'bg-[#F59E0B]/10 text-[#F59E0B]',
 red: 'bg-[#EF4444]/10 text-[#EF4444]',
 };
 return (
 <Card className="p-5">
 <div className="flex items-center justify-between mb-3">
 <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors[color])}>
 <Icon size={20} />
 </div>
 {trend && <span className={cn('text-xs font-medium', trend > 0 ? 'text-green-600' : 'text-red-500')}>{trend > 0 ? '+' : ''}{trend}%</span>}
 </div>
 <p className="text-2xl font-bold text-[#0F172A]">{value}</p>
 <p className="text-sm text-[#64748B] mt-1">{label}</p>
 </Card>
 );
};

// Spinner
export const Spinner = ({ size = 'md' }) => {
 const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
 return (
 <div className="flex items-center justify-center">
 <Loader2 className={cn('animate-spin text-[#C4DFDF]', sizes[size])} />
 </div>
 );
};

// PageLoader
export const PageLoader = () => (
 <div className="min-h-screen flex items-center justify-center">
 <div className="text-center">
 <div className="w-12 h-12 rounded-2xl bg-[#C4DFDF] flex items-center justify-center mx-auto mb-4">
 <span className="text-[#0f172a] font-bold text-xl">T</span>
 </div>
 <Spinner />
 </div>
 </div>
);
