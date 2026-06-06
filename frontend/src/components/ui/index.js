import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2, X, Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────────────────────────────────────
export const Button = ({ children, variant = 'primary', size = 'md', loading, className, ...props }) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed select-none';
    const variants = {
        primary: 'bg-[#71C9CE] text-white hover:bg-[#5DB0B5] hover:-translate-y-0.5 shadow-brand active:scale-95',
        secondary: 'bg-[#A6E3E9] text-[#1F2937] hover:bg-[#8DD8DF] hover:-translate-y-0.5 active:scale-95',
        ghost: 'bg-transparent text-[#71C9CE] border border-[#71C9CE] hover:bg-[#71C9CE]/10 active:scale-95',
        danger: 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 active:scale-95',
        outline: 'border border-[#B8E8EC] text-[#6B7280] hover:border-[#71C9CE] hover:text-[#357B7E] hover:bg-[#71C9CE]/5',
        white: 'bg-white text-[#1F2937] border border-[#E5E7EB] hover:bg-gray-50 active:scale-95',
        dark: 'bg-[#1F2937] text-white hover:bg-[#374151] hover:-translate-y-0.5 active:scale-95',
    };
    const sizes = {
        xs: 'px-2.5 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            className={cn(base, variants[variant], sizes[size], className)}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {children}
        </button>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────────────────────────────────────
export const Badge = ({ children, className, dot, ...props }) => (
    <span className={cn('badge', className)} {...props}>
        {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
        {children}
    </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────────
export const Card = ({ children, className, flat, white, ...props }) => (
    <div className={cn(white ? 'card-white' : flat ? 'card-flat' : 'card', className)} {...props}>
        {children}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────────────────────
export const Input = React.forwardRef(({ label, error, hint, className, type, icon: Icon, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="w-full">
            {label && <label className="label">{label}</label>}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none">
                        <Icon size={16} />
                    </div>
                )}
                <input
                    ref={ref}
                    type={inputType}
                    className={cn(
                        'input',
                        Icon && 'pl-9',
                        isPassword && 'pr-10',
                        error && 'border-red-400 focus:border-red-400',
                        className
                    )}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                )}
            </div>
            {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
            {hint && !error && <p className="mt-1 text-xs text-[#9CA3AF]">{hint}</p>}
        </div>
    );
});
Input.displayName = 'Input';

// ─────────────────────────────────────────────────────────────────────────────
// Textarea
// ─────────────────────────────────────────────────────────────────────────────
export const Textarea = React.forwardRef(({ label, error, className, ...props }, ref) => (
    <div className="w-full">
        {label && <label className="label">{label}</label>}
        <textarea
            ref={ref}
            className={cn('input resize-none', error && 'border-red-400', className)}
            {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
));
Textarea.displayName = 'Textarea';

// ─────────────────────────────────────────────────────────────────────────────
// Select
// ─────────────────────────────────────────────────────────────────────────────
export const Select = React.forwardRef(({ label, error, children, className, ...props }, ref) => (
    <div className="w-full">
        {label && <label className="label">{label}</label>}
        <select
            ref={ref}
            className={cn('input', error && 'border-red-400', className)}
            {...props}
        >
            {children}
        </select>
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
));
Select.displayName = 'Select';

// ─────────────────────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────────────────────
import { createPortal } from 'react-dom';

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };
    
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 bg-[#1F2937]/40 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        className={cn(
                            'relative w-full rounded-2xl flex flex-col shadow-2xl',
                            'bg-[#E3FDFD] border border-[#B8E8EC]',
                            sizes[size]
                        )}
                        style={{ maxHeight: '90vh' }}
                    >
                        {title && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#B8E8EC] shrink-0">
                                <h3 className="text-base font-semibold text-[#1F2937]">{title}</h3>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-lg hover:bg-[#71C9CE]/15 text-[#6B7280] hover:text-[#1F2937] transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                        <div className="p-6 overflow-y-auto flex-1 text-[#1F2937]">{children}</div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────
export const Skeleton = ({ className }) => (
    <div className={cn('skeleton', className)} />
);

export const SkeletonCard = () => (
    <Card className="p-4 space-y-3" flat>
        <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-xl" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
        </div>
    </Card>
);

// ─────────────────────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────────────────────
export const Avatar = ({ src, name, size = 'md', className }) => {
    const sizes = {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-14 h-14 text-base',
        xl: 'w-20 h-20 text-xl',
    };
    const initials = name
        ? name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return src ? (
        <img
            src={src}
            alt={name}
            className={cn('rounded-full object-cover ring-2 ring-[#E3FDFD]', sizes[size], className)}
        />
    ) : (
        <div
            className={cn(
                'rounded-full flex items-center justify-center font-semibold ring-2 ring-[#E3FDFD]',
                'bg-gradient-to-br from-[#71C9CE] to-[#5DB0B5] text-white',
                sizes[size],
                className
            )}
        >
            {initials}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="flex flex-col items-center justify-center py-14 text-center">
        {Icon && (
            <div className="w-16 h-16 rounded-2xl bg-[#CBF1F5] border border-[#A6E3E9] flex items-center justify-center mb-4">
                <Icon size={28} className="text-[#71C9CE]" />
            </div>
        )}
        <h3 className="text-base font-semibold text-[#1F2937] mb-1">{title}</h3>
        {description && (
            <p className="text-sm text-[#6B7280] max-w-xs mb-6 leading-relaxed">{description}</p>
        )}
        {action}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, trend, color = 'brand', subtitle }) => {
    const palette = {
        brand: { bg: 'bg-[#71C9CE]/15', text: 'text-[#4A9699]' },
        primary: { bg: 'bg-[#71C9CE]/15', text: 'text-[#4A9699]' },
        green: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
        amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
        red: { bg: 'bg-red-100', text: 'text-red-500' },
        cyan: { bg: 'bg-[#A6E3E9]/40', text: 'text-[#357B7E]' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    };
    const c = palette[color] || palette.brand;
    const isPositive = trend > 0;

    return (
        <Card className="p-5">
            <div className="flex items-start justify-between mb-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.bg)}>
                    <Icon size={19} className={c.text} />
                </div>
                {trend !== undefined && (
                    <span className={cn(
                        'flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
                        isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    )}>
                        {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {isPositive ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-[#1F2937] tabular-nums">{value}</p>
            <p className="text-sm text-[#6B7280] mt-0.5 font-medium">{label}</p>
            {subtitle && <p className="text-xs text-[#9CA3AF] mt-1">{subtitle}</p>}
        </Card>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Spinner / PageLoader
// ─────────────────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md' }) => {
    const sizes = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-10 h-10' };
    return (
        <div className="flex items-center justify-center">
            <Loader2 className={cn('animate-spin text-[#71C9CE]', sizes[size])} />
        </div>
    );
};

export const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#CBF1F5]">
        <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#71C9CE] to-[#4A9699] flex items-center justify-center mx-auto shadow-brand">
                <span className="text-white font-bold text-2xl">H</span>
            </div>
            <Spinner />
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// ProgressBar
// ─────────────────────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, max = 100, color = 'brand', label, className }) => {
    const pct = Math.min(Math.round((value / max) * 100), 100);
    const bars = { brand: 'bg-[#71C9CE]', green: 'bg-emerald-500', amber: 'bg-amber-400', red: 'bg-red-500' };

    return (
        <div className={cn('space-y-1.5', className)}>
            {label && (
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6B7280] font-medium">{label}</span>
                    <span className="text-xs font-semibold text-[#1F2937]">{pct}%</span>
                </div>
            )}
            <div className="h-2 bg-[#CBF1F5] rounded-full overflow-hidden border border-[#A6E3E9]/40">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', bars[color] || bars.brand)}
                />
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Divider
// ─────────────────────────────────────────────────────────────────────────────
export const Divider = ({ label, className }) => (
    <div className={cn('relative flex items-center', className)}>
        <div className="flex-1 border-t border-[#B8E8EC]" />
        {label && (
            <span className="px-3 text-xs text-[#9CA3AF] bg-[#E3FDFD] font-medium">{label}</span>
        )}
        <div className="flex-1 border-t border-[#B8E8EC]" />
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SectionHeader
// ─────────────────────────────────────────────────────────────────────────────
export const SectionHeader = ({ title, action, className }) => (
    <div className={cn('flex items-center justify-between mb-4', className)}>
        <h2 className="section-title">{title}</h2>
        {action}
    </div>
);
