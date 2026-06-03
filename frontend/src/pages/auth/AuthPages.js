import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Briefcase, User, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/ui';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form);
      toast.success('Welcome back!');
      const routes = { CANDIDATE: '/candidate/dashboard', COMPANY: '/company/dashboard', ADMIN: '/admin/dashboard' };
      navigate(routes[data.user.role] || '/');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Check your credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <span className="text-white font-bold text-xl">TalentFlow</span>
        </div>
        <div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-4xl font-bold text-white mb-4">Find your next great opportunity</h1>
            <p className="text-primary-200 text-lg">Connect with top companies and manage your entire hiring journey in one place.</p>
          </motion.div>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[['10K+', 'Active Jobs'], ['5K+', 'Companies'], ['50K+', 'Hires Made']].map(([num, label]) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-bold text-white">{num}</p>
                <p className="text-primary-200 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-primary-300 text-sm">© 2024 TalentFlow ATS</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-950">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="text-gray-500 mt-2">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign In
            </Button>
          </form>

          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-500">
            <p className="font-medium mb-2 text-gray-700 dark:text-gray-300">Demo accounts:</p>
            <p>Admin: admin@talentflow.com / admin123456</p>
            <p>Company: hr@techcorp.com / company123456</p>
            <p>Candidate: john@example.com / candidate123456</p>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:underline font-medium">Sign up</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('CANDIDATE');
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', companyName: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await register({ ...form, role });
      toast.success('Account created successfully!');
      navigate(data.user.role === 'CANDIDATE' ? '/candidate/dashboard' : '/company/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Create account</h2>
          <p className="text-gray-500 mt-2">Join TalentFlow today</p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[{ value: 'CANDIDATE', icon: User, label: 'Job Seeker' }, { value: 'COMPANY', icon: Building2, label: 'Employer' }].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                role === value
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              )}
            >
              <Icon size={24} className={role === value ? 'text-primary-600' : 'text-gray-400'} />
              <span className={cn('text-sm font-medium', role === value ? 'text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400')}>
                {label}
              </span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {role === 'CANDIDATE' ? (
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" placeholder="John" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required />
              <Input label="Last Name" placeholder="Doe" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} required />
            </div>
          ) : (
            <Input label="Company Name" placeholder="Acme Corp" value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} required />
          )}
          <Input label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          <Input label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          <Button type="submit" loading={loading} className="w-full" size="lg">Create Account</Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
