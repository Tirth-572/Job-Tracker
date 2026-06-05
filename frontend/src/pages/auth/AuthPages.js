import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Select } from '../../components/ui';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

const INDUSTRIES = [
  '🏢 IT & Software', '💰 Finance & Banking', '🏥 Healthcare', '🎓 Education',
  '🛒 E-Commerce & Retail', '🏭 Manufacturing', '📢 Marketing & Advertising',
  '👥 Recruitment & HR', '🏗️ Real Estate & Construction', '📦 Logistics & Transportation',
  '✈️ Travel & Hospitality', '🎬 Media & Entertainment', '🌱 Agriculture',
  '🏛️ Government', '🤝 NGO / Non-Profit', '📈 Consulting', '🚀 Startup', '📋 Other'
];

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export const LoginPage = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [pendingGoogleCredential, setPendingGoogleCredential] = useState(null);
  const [googleData, setGoogleData] = useState(null);
  const [selectedRole, setSelectedRole] = useState('CANDIDATE');

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await googleLogin({ credential: credentialResponse.credential });
      if (data.requiresRoleSelection) {
        setPendingGoogleCredential(credentialResponse.credential);
        setGoogleData(data.googleData);
      } else {
        toast.success('Welcome back!');
        const routes = { CANDIDATE: '/candidate/dashboard', COMPANY: '/company/dashboard', ADMIN: '/admin/dashboard' };
        navigate(routes[data.user.role] || '/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google Login failed.');
    }
  };

  const completeGoogleLogin = async () => {
    try {
      setLoading(true);
      const data = await googleLogin({
        credential: pendingGoogleCredential,
        role: selectedRole,
        customData: { companyName: `${googleData.given_name}'s Company` }
      });
      toast.success('Account created successfully!');
      const routes = { CANDIDATE: '/candidate/dashboard', COMPANY: '/company/dashboard', ADMIN: '/admin/dashboard' };
      navigate(routes[data.user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

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

  if (pendingGoogleCredential) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-[#F8FAFC]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-[#FFFFFF] p-8 rounded-2xl shadow-xl border border-[#E2E8F0]">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#0F172A]">Complete your profile</h2>
            <p className="text-[#64748B] mt-2">Hi {googleData?.given_name}, how do you want to use HireBridge?</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[{ value: 'CANDIDATE', icon: User, label: 'Job Seeker' }, { value: 'COMPANY', icon: Building2, label: 'Company' }].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedRole(value)}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300',
                  selectedRole === value
                    ? 'border-[#635BFF] bg-[#635BFF]/5 text-[#635BFF]'
                    : 'border-[#E2E8F0] hover:border-[#635BFF] text-[#64748B] hover:text-[#0F172A]'
                )}
              >
                <Icon size={24} className={selectedRole === value ? 'text-[#635BFF]' : 'text-[#64748B]'} />
                <span className={cn('text-sm font-medium mt-2')}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          <Button onClick={completeGoogleLogin} loading={loading} className="w-full" size="lg">Continue</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#635BFF] p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="HireBridge" className="h-32 w-60 object-contain rounded-lg p-1.5 bg-white/10 backdrop-blur-sm" />
        </div>
        <div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className="text-4xl font-bold text-white mb-4">Find your next great opportunity</h1>
            <p className="text-white/80 text-lg">Connect with top companies and manage your entire hiring journey in one place.</p>
          </motion.div>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[['10K+', 'Active Jobs'], ['5K+', 'Companies'], ['50K+', 'Hires Made']].map(([num, label]) => (
              <div key={label}>
                <div className="text-2xl font-bold text-white">{num}</div>
                <div className="text-white/80 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/60 text-sm">© 2024 HireBridge ATS</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F8FAFC]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md bg-[#FFFFFF] p-8 rounded-2xl shadow-xl border border-[#E2E8F0]"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0F172A]">Welcome back</h2>
            <p className="text-[#64748B] mt-2">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email or Phone number"
              type="text"
              placeholder="you@example.com or +1234567890"
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E2E8F0]"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-[#FFFFFF] text-[#64748B]">Or continue with</span></div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google Login Failed')}
            />
          </div>

          <div className="mt-4 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#64748B]">
            <p className="font-medium mb-2 text-[#0F172A]">Demo accounts (click to fill):</p>
            <div className="space-y-1">
              <p className="cursor-pointer hover:bg-[#E2E8F0]/50 p-1.5 -mx-1.5 rounded transition-colors" onClick={() => setForm({ email: 'admin@hirebridge.com', password: 'admin123456' })}>
                <span className="font-semibold text-[#0F172A]">Admin:</span> admin@hirebridge.com
              </p>
              <p className="cursor-pointer hover:bg-[#E2E8F0]/50 p-1.5 -mx-1.5 rounded transition-colors" onClick={() => setForm({ email: 'company@test.com', password: 'password123' })}>
                <span className="font-semibold text-[#0F172A]">Company:</span> company@test.com
              </p>
              <p className="cursor-pointer hover:bg-[#E2E8F0]/50 p-1.5 -mx-1.5 rounded transition-colors" onClick={() => setForm({ email: 'john@example.com', password: 'password123' })}>
                <span className="font-semibold text-[#0F172A]">Candidate:</span> john@example.com
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-[#64748B] mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#635BFF] hover:underline font-medium">Sign up</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export const RegisterPage = () => {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('CANDIDATE');
  const [form, setForm] = useState({ email: '', phone: '', password: '', firstName: '', lastName: '', companyName: '', companyLocation: '', companyType: '', customCompanyType: '', companyWebsite: '', companyLinkedin: '' });
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const data = await googleLogin({
        credential: credentialResponse.credential,
        role: role, // we already know the role they selected on the register screen!
        customData: { companyName: 'My Company' } // simple default
      });
      if (data.requiresRoleSelection) {
        // They didn't pass role for some reason, or backend rejected
      } else {
        toast.success('Account created successfully!');
        const routes = { CANDIDATE: '/candidate/dashboard', COMPANY: '/company/dashboard', ADMIN: '/admin/dashboard' };
        navigate(routes[data.user.role] || '/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, role };
      if (payload.companyType === '📋 Other') {
        payload.companyType = payload.customCompanyType;
      } else if (payload.companyType === '🚀 Startup') {
        payload.companyType = `🚀 Startup - ${payload.customCompanyType}`;
      }
      const data = await register(payload);
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
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#F8FAFC]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-[#FFFFFF] p-8 rounded-2xl shadow-xl border border-[#E2E8F0]">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="HireBridge" className="h-32 w-60 mx-auto mb-4 object-contain" />
          <h2 className="text-3xl font-bold text-[#0F172A]">Create account</h2>
          <p className="text-[#64748B] mt-2">Join HireBridge today</p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[{ value: 'CANDIDATE', icon: User, label: 'Job Seeker' }, { value: 'COMPANY', icon: Building2, label: 'Company' }].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                role === value
                  ? 'border-[#635BFF] bg-[#635BFF]/5'
                  : 'border-[#E2E8F0] hover:border-[#E2E8F0]'
              )}
            >
              <Icon size={24} className={role === value ? 'text-[#635BFF]' : 'text-[#64748B]'} />
              <span className={cn('text-sm font-medium', role === value ? 'text-[#635BFF]' : 'text-[#64748B]')}>
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
            <>
              <Input label="Company Name" placeholder="Acme Corp" value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Location" placeholder="San Francisco, CA" value={form.companyLocation} onChange={e => setForm(p => ({ ...p, companyLocation: e.target.value }))} required />
                <Select label="Company Type / Industry" value={form.companyType} onChange={e => setForm(p => ({ ...p, companyType: e.target.value }))} required>
                  <option value="" disabled>Select Industry</option>
                  {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </Select>
              </div>
              {['📋 Other', '🚀 Startup'].includes(form.companyType) && (
                <Input label={form.companyType === '🚀 Startup' ? "Startup Focus / Domain" : "Specify Custom Industry"} placeholder={form.companyType === '🚀 Startup' ? "e.g. EdTech, FinTech, AI" : "e.g. Space Exploration"} value={form.customCompanyType} onChange={e => setForm(p => ({ ...p, customCompanyType: e.target.value }))} required />
              )}
              <div className="grid grid-cols-2 gap-3">
                <Input label="Company Website" placeholder="https://example.com" type="url" value={form.companyWebsite} onChange={e => setForm(p => ({ ...p, companyWebsite: e.target.value }))} />
                <Input label="LinkedIn Page" placeholder="https://linkedin.com/company/..." type="url" value={form.companyLinkedin} onChange={e => setForm(p => ({ ...p, companyLinkedin: e.target.value }))} />
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            <Input label="Phone Number" type="tel" placeholder="+1234567890" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <Input label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          <Button type="submit" loading={loading} className="w-full" size="lg">Create Account</Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E2E8F0]"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-[#FFFFFF] text-[#64748B]">Or register with</span></div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Google Sign Up Failed')}
            text="signup_with"
          />
        </div>

        <p className="text-center text-sm text-[#64748B] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#635BFF] hover:underline font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

