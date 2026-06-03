import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Button
export const Button = ({ children, variant = 'primary', size = 'md', loading, className, ...props }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm',
    secondary: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800',
    outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
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

// Input
export const Input = React.forwardRef(({ label, error, className, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <input ref={ref} className={cn('input', error && 'border-red-500 focus:ring-red-500', className)} {...props} />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));

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
            className={cn('relative w-full card p-0 flex flex-col', sizes[size])}
            style={{ maxHeight: '90vh' }}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
            )}
            <div className="p-6 overflow-y-auto flex-1">{children}</div>
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
    <div className={cn('rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold flex items-center justify-center', sizes[size], className)}>
      {initials}
    </div>
  );
};

// Empty State
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon size={32} className="text-gray-400" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>}
    {action}
  </div>
);

// Stat Card
export const StatCard = ({ icon: Icon, label, value, trend, color = 'primary' }) => {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors[color])}>
          <Icon size={20} />
        </div>
        {trend && <span className={cn('text-xs font-medium', trend > 0 ? 'text-green-600' : 'text-red-500')}>{trend > 0 ? '+' : ''}{trend}%</span>}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </Card>
  );
};

// Spinner
export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center">
      <Loader2 className={cn('animate-spin text-primary-600', sizes[size])} />
    </div>
  );
};

// PageLoader
export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4">
        <span className="text-white font-bold text-xl">T</span>
      </div>
      <Spinner />
    </div>
  </div>
);
