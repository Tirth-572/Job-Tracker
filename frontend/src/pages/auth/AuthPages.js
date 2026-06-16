import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Building2, ArrowRight, Zap, Globe, Shield, Mail, Key, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { Button, Input, Select, Divider } from '../../components/ui';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { cn } from '../../lib/utils';

export const INDUSTRIES = [
  '🏢 IT & Software', '💰 Finance & Banking', '🏥 Healthcare', '🎓 Education',
  '🛒 E-Commerce & Retail', '🏭 Manufacturing', '📢 Marketing & Advertising',
  '👥 Recruitment & HR', '🏗️ Real Estate', '📦 Logistics', '✈️ Travel & Hospitality',
  '🎬 Media & Entertainment', '🌱 Agriculture', '🏛️ Government', '🤝 NGO / Non-Profit',
  '📈 Consulting', '🚀 Startup', '📋 Other',
];

const FEATURES = [
  { icon: Zap, text: 'Apply to jobs in one click' },
  { icon: Globe, text: 'Discover top companies globally' },
  { icon: Shield, text: 'Track every application step' },
];

// ── Left panel ────────────────────────────────────────────────────────────────
const AuthLeft = () => (
  <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] relative overflow-hidden flex-col p-12 justify-between"
    style={{ background: 'linear-gradient(135deg, #71C9CE 0%, #4A9699 60%, #357B7E 100%)' }}>
    <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/8 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/8 translate-y-1/2 -translate-x-1/3 pointer-events-none blur-2xl" />

    <div className="relative z-10 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
        <span className="text-white font-bold text-lg">H</span>
      </div>
      <span className="text-white font-bold text-xl tracking-tight">HireBridge</span>
    </div>

    <div className="relative z-10">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
        <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
          Your career,<br /><span className="text-white/75">reimagined.</span>
        </h1>
        <p className="text-white/75 text-lg leading-relaxed mb-10">
          Connect with top companies and manage your entire hiring journey in one place.
        </p>

        <div className="space-y-3 mb-10">
          {FEATURES.map(({ icon: Icon, text }, i) => (
            <motion.div key={text} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center border border-white/20 shrink-0">
                <Icon size={15} className="text-white/85" />
              </div>
              <span className="text-white/80 text-sm font-medium">{text}</span>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[['10K+', 'Active Jobs'], ['5K+', 'Companies'], ['50K+', 'Hires']].map(([num, label]) => (
            <div key={label} className="bg-white/10 rounded-xl p-3 border border-white/15 text-center">
              <div className="text-xl font-bold text-white">{num}</div>
              <div className="text-white/65 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>

    <p className="text-white/40 text-xs relative z-10">© 2024 HireBridge ATS. All rights reserved.</p>
  </div>
);

// ── Role Selector ─────────────────────────────────────────────────────────────
const RoleSelector = ({ value, onChange }) => (
  <div className="grid grid-cols-2 gap-3">
    {[
      { value: 'CANDIDATE', icon: User, label: 'Job Seeker', desc: 'Find & apply to jobs' },
      { value: 'COMPANY', icon: Building2, label: 'Employer', desc: 'Post & manage roles' },
    ].map(({ value: v, icon: Icon, label, desc }) => (
      <button key={v} type="button" onClick={() => onChange(v)}
        className={cn(
          'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 text-center gap-1.5',
          value === v
            ? 'border-[#71C9CE] bg-[#CBF1F5]'
            : 'border-[#D1E8EA] hover:border-[#A6E3E9] hover:bg-[#E3FDFD] bg-white'
        )}>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-all', value === v ? 'bg-[#71C9CE]/20' : 'bg-[#CBF1F5]')}>
          <Icon size={18} className={value === v ? 'text-[#4A9699]' : 'text-[#9CA3AF]'} />
        </div>
        <span className={cn('text-sm font-semibold', value === v ? 'text-[#357B7E]' : 'text-[#1F2937]')}>{label}</span>
        <span className="text-xs text-[#9CA3AF]">{desc}</span>
      </button>
    ))}
  </div>
);

// ── Demo accounts ─────────────────────────────────────────────────────────────
const DemoAccounts = ({ onSelect }) => (
  <div className="mt-4 p-3.5 bg-[#CBF1F5] border border-[#B8E8EC] rounded-xl">
    <p className="text-xs font-semibold text-[#6B7280] mb-2 uppercase tracking-wide">Demo accounts</p>
    <div className="space-y-1">
      {[
        { label: 'Admin', email: 'admin@hirebridge.com', password: 'admin123456' },
        { label: 'Company', email: 'company@test.com', password: 'password123' },
        { label: 'Candidate', email: 'john@example.com', password: 'password123' },
      ].map(acc => (
        <button key={acc.label} onClick={() => onSelect(acc)}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white text-left transition-colors group">
          <div>
            <span className="text-xs font-semibold text-[#1F2937]">{acc.label}: </span>
            <span className="text-xs text-[#9CA3AF]">{acc.email}</span>
          </div>
          <ArrowRight size={12} className="text-[#B8E8EC] group-hover:text-[#71C9CE] transition-colors" />
        </button>
      ))}
    </div>
  </div>
);

// ── LoginPage ─────────────────────────────────────────────────────────────────
export const LoginPage = () => {
  const { login, dummyLogin, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', otp: '' });
  const [loading, setLoading] = useState(false);
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState(null);
  const [googleData, setGoogleData] = useState(null);
  const [selectedRole, setSelectedRole] = useState('CANDIDATE');
  const [loginMethod, setLoginMethod] = useState('otp'); // strictly otp
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const routes = { CANDIDATE: '/candidate/dashboard', COMPANY: '/company/dashboard', ADMIN: '/admin/dashboard' };

  const handleDummyLogin = async (acc) => {
    setLoading(true);
    try {
      const data = await dummyLogin(acc.email);
      toast.success(`Logged in as ${acc.label}!`);
      navigate(routes[data.user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Dummy login failed. Ensure the account exists.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (cr) => {
    try {
      const data = await googleLogin({ credential: cr.credential });
      if (data.requiresRoleSelection) { setPendingGoogleCredential(cr.credential); setGoogleData(data.googleData); }
      else { toast.success('Welcome back!'); navigate(routes[data.user.role] || '/'); }
    } catch (err) { toast.error(err.response?.data?.message || 'Google Login failed.'); }
  };

  const completeGoogleLogin = async () => {
    try {
      setLoading(true);
      const data = await googleLogin({ credential: pendingGoogleCredential, role: selectedRole, customData: { companyName: `${googleData.given_name}'s Company` } });
      toast.success('Account created!');
      if (data.user.role === 'CANDIDATE') {
        localStorage.setItem('candidateOnboarding', 'true');
        navigate('/candidate/dashboard');
      } else {
        navigate('/company/dashboard');
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    if (!form.email) return toast.error('Please enter your email address');
    setSendingOtp(true);
    try {
      await authAPI.sendOtp({ identifier: form.email });
      toast.success('Verification code sent!');
      setOtpSent(true);
      setCountdown(180);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (!otpSent) {
      return handleSendOtp();
    }
    
    if (!form.otp) {
      return toast.error('Please enter the verification code');
    }

    setLoading(true);
    try {
      const data = await login(form);
      toast.success('Welcome back!');
      navigate(routes[data.user.role] || '/');
    } catch (err) { toast.error(err.response?.data?.message || err.message || 'Login failed.'); }
    finally { setLoading(false); }
  };

  if (pendingGoogleCredential) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#CBF1F5]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-[#E3FDFD] p-8 rounded-2xl shadow-card-lg border border-[#B8E8EC]">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#71C9CE] to-[#4A9699] flex items-center justify-center mx-auto mb-4 shadow-brand">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <h2 className="text-xl font-bold text-[#1F2937]">One last step</h2>
            <p className="text-[#6B7280] text-sm mt-1">Hi {googleData?.given_name}, how will you use HireBridge?</p>
          </div>
          <RoleSelector value={selectedRole} onChange={setSelectedRole} />
          <Button onClick={completeGoogleLogin} loading={loading} className="w-full mt-6" size="lg">
            Continue <ArrowRight size={16} />
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#CBF1F5]">
      <AuthLeft />
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#71C9CE] to-[#4A9699] flex items-center justify-center shadow-brand">
              <span className="text-white font-bold">H</span>
            </div>
            <span className="font-bold text-[#1F2937] text-lg">HireBridge</span>
          </div>

          <div className="bg-[#E3FDFD] rounded-2xl border border-[#B8E8EC] shadow-card p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-[#1F2937]">Welcome back</h2>
              <p className="text-[#6B7280] mt-1 text-sm">Sign in to continue to HireBridge</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email Address" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required disabled={otpSent} />
              
              {otpSent && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <Input label="Verification Code" type="text" placeholder="123456"
                    value={form.otp} onChange={e => setForm(p => ({ ...p, otp: e.target.value }))} required maxLength={6} />
                </div>
              )}

              <Button type="submit" loading={loading || sendingOtp} className="w-full" size="lg">
                {!otpSent ? 'Send Verification Code' : (
                  <>Verify & Sign In <ArrowRight size={16} /></>
                )}
              </Button>

              {otpSent && (
                <button type="button" onClick={handleSendOtp} disabled={countdown > 0} className={cn("w-full text-sm font-semibold mt-2 text-center transition-colors", countdown > 0 ? "text-[#9CA3AF] cursor-not-allowed" : "text-[#71C9CE] hover:text-[#4A9699]")}>
                  {countdown > 0 ? `Resend Code in ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}` : 'Resend Code'}
                </button>
              )}
            </form>

            <Divider label="or continue with" className="my-5" />
            <div className="flex justify-center">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google Login Failed')} />
            </div>

            <DemoAccounts onSelect={handleDummyLogin} />

            <p className="text-center text-sm text-[#6B7280] mt-5">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#71C9CE] hover:text-[#4A9699] font-semibold transition-colors">Sign up free</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ── RegisterPage ──────────────────────────────────────────────────────────────
export const RegisterPage = () => {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('CANDIDATE');
  const [form, setForm] = useState({
    email: '', phone: '', password: '', otp: '', firstName: '', lastName: '',
    companyName: '', companyLocation: '', companyType: '', customCompanyType: '',
    companyWebsite: '', companyLinkedin: '',
  });
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);
  const routes = { CANDIDATE: '/candidate/dashboard', COMPANY: '/company/dashboard', ADMIN: '/admin/dashboard' };

  const handleGoogleSuccess = async (cr) => {
    try {
      setLoading(true);
      const data = await googleLogin({ credential: cr.credential, role, customData: { companyName: 'My Company' } });
      if (!data.requiresRoleSelection) { 
        toast.success('Account created!'); 
        if (data.user.role === 'CANDIDATE') {
          localStorage.setItem('candidateOnboarding', 'true');
          navigate('/candidate/dashboard');
        } else {
          navigate('/company/dashboard');
        }
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Google Registration failed.'); }
    finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    if (!form.email) return toast.error('Please enter your email address');
    setSendingOtp(true);
    try {
      await authAPI.sendOtp({ identifier: form.email });
      toast.success('Verification code sent!');
      setOtpSent(true);
      setCountdown(180);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    if (!otpSent) {
      return handleSendOtp();
    }

    if (!form.otp) return toast.error('Please enter the verification code');

    setLoading(true);
    try {
      const payload = { ...form, role };
      if (payload.companyType === '📋 Other') payload.companyType = payload.customCompanyType;
      else if (payload.companyType === '🚀 Startup') payload.companyType = `🚀 Startup - ${payload.customCompanyType}`;
      const data = await register(payload);
      toast.success('Account created!');
      if (data.user.role === 'CANDIDATE') {
        localStorage.setItem('candidateOnboarding', 'true');
        navigate('/candidate/dashboard');
      } else {
        navigate('/company/dashboard');
      }
    } catch (err) { toast.error(err.response?.data?.message || err.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  const f = (key) => ({ value: form[key], onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) });

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#CBF1F5]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
        <div className="bg-[#E3FDFD] rounded-2xl border border-[#B8E8EC] shadow-card p-8">
          <div className="text-center mb-7">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#71C9CE] to-[#4A9699] flex items-center justify-center mx-auto mb-3 shadow-brand">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <h2 className="text-2xl font-bold text-[#1F2937]">Create account</h2>
            <p className="text-[#6B7280] text-sm mt-1">Join HireBridge today — it's free</p>
          </div>

          <RoleSelector value={role} onChange={setRole} />

          <form onSubmit={handleSubmit} className="space-y-3.5 mt-5">
            {role === 'CANDIDATE' ? (
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name" placeholder="John" {...f('firstName')} required />
                <Input label="Last Name" placeholder="Doe" {...f('lastName')} required />
              </div>
            ) : (
              <>
                <Input label="Company Name" placeholder="Acme Corp" {...f('companyName')} required />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Location" placeholder="New York, NY" {...f('companyLocation')} required />
                  <Select label="Industry" {...f('companyType')} required>
                    <option value="" disabled>Select Industry</option>
                    {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </Select>
                </div>
                {['📋 Other', '🚀 Startup'].includes(form.companyType) && (
                  <Input label={form.companyType === '🚀 Startup' ? 'Startup Domain' : 'Specify Industry'}
                    placeholder={form.companyType === '🚀 Startup' ? 'e.g. EdTech, FinTech' : 'e.g. Space Exploration'}
                    {...f('customCompanyType')} required />
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Website" placeholder="https://..." type="url" {...f('companyWebsite')} />
                  <Input label="LinkedIn" placeholder="https://linkedin.com/..." type="url" {...f('companyLinkedin')} />
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Email" type="email" placeholder="you@example.com" {...f('email')} required disabled={otpSent} />
              <Input label="Phone" type="tel" placeholder="+1 234 567 890" {...f('phone')} required disabled={otpSent} />
            </div>
            
            {!otpSent ? (
              <Input label="Password" type="password" placeholder="Min. 8 characters" {...f('password')} required />
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Input label="Verification Code" type="text" placeholder="123456" {...f('otp')} required maxLength={6} />
                <button type="button" onClick={handleSendOtp} disabled={countdown > 0} className={cn("text-xs font-semibold mt-1", countdown > 0 ? "text-[#9CA3AF] cursor-not-allowed" : "text-[#71C9CE] hover:text-[#4A9699]")}>
                  {countdown > 0 ? `Resend Code in ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}` : 'Resend Code'}
                </button>
              </div>
            )}
            
            <Button type="submit" loading={loading || sendingOtp} className="w-full" size="lg">
              {!otpSent ? 'Send Verification Code' : (
                <>Verify & Create Account <ArrowRight size={16} /></>
              )}
            </Button>
          </form>

          <Divider label="or register with" className="my-5" />
          <div className="flex justify-center">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error('Google Sign Up Failed')} text="signup_with" />
          </div>

          <p className="text-center text-sm text-[#6B7280] mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-[#71C9CE] hover:text-[#4A9699] font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
