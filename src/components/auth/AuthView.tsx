import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Lock,
  User,
  Phone,
  GraduationCap,
  ArrowRight,
  Loader2,
  KeyRound,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthViewProps {
  onSuccess?: () => void;
}

function formatAuthError(err: any): string {
  const rawMsg = err?.message || err?.error_description || (typeof err === 'string' ? err : '');
  const msg = rawMsg.toLowerCase();
  const status = err?.status;

  // Supabase Rate-Limit (HTTP 429, over_email_send_rate_limit, over_request_rate_limit, too many requests, email rate limit exceeded)
  if (
    status === 429 ||
    msg.includes('rate limit') ||
    msg.includes('email rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('over_email_send_rate_limit') ||
    msg.includes('over_request_rate_limit') ||
    msg.includes('exceeded') ||
    msg.includes('security purposes')
  ) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }

  if (
    msg.includes('user already registered') ||
    msg.includes('already registered') ||
    msg.includes('already exists')
  ) {
    return 'An account with this email already exists. Please sign in or reset your password.';
  }
  if (
    msg.includes('password') &&
    (msg.includes('short') || msg.includes('weak') || msg.includes('least 6 characters') || msg.includes('pwned'))
  ) {
    return 'Please choose a stronger password (minimum 6 characters).';
  }
  if (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('fetch error') ||
    msg.includes('networkerror') ||
    msg.includes('load failed')
  ) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please verify your email address to log in.';
  }
  if (
    msg.includes('invalid login credentials') ||
    msg.includes('invalid_grant') ||
    msg.includes('invalid credentials')
  ) {
    return 'Invalid email or password. Please check your credentials.';
  }
  if (msg.includes('redirect')) {
    return 'Authentication redirect configuration error.';
  }
  if (msg.includes('user not found')) {
    return 'No account found with this email address.';
  }

  return rawMsg || 'Authentication request failed. Please check your details and try again.';
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const { login, register, resendVerificationEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'verify_email'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [classGrade, setClassGrade] = useState('Class 12');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter your registered email address and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await login(cleanEmail, password);
      if (res?.user) {
        onSuccess?.();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const formatted = formatAuthError(err);
      if (err?.message?.toLowerCase().includes('email not confirmed')) {
        setMode('verify_email');
      }
      setErrorMsg(formatted);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 7) {
      setErrorMsg('Please enter a valid phone number.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Please choose a stronger password (minimum 6 characters).');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await register({
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password,
        classGrade,
      });

      if (result.emailConfirmationRequired) {
        // Email confirmation is required by Supabase Auth configuration
        setMode('verify_email');
        setSuccessMsg('Registration successful. Please check your email to verify your account.');
      } else if (result.session) {
        setSuccessMsg('Account created successfully! Welcome to Vedika LearnHub.');
        onSuccess?.();
      } else {
        setMode('verify_email');
        setSuccessMsg('Registration successful. Please check your email to verify your account.');
      }
    } catch (err: any) {
      console.error('Register error:', err);
      setErrorMsg(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword(cleanEmail);
      setSuccessMsg(`Password reset instructions have been sent to ${cleanEmail}. Please check your inbox.`);
    } catch (err: any) {
      setErrorMsg(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim() || resendStatus === 'sending' || isSubmitting) return;
    try {
      setErrorMsg(null);
      setResendStatus('sending');
      await resendVerificationEmail(email.trim());
      setResendStatus('sent');
      setSuccessMsg('A new verification email has been sent. Please check your inbox.');
      setTimeout(() => setResendStatus('idle'), 6000);
    } catch (err: any) {
      setResendStatus('idle');
      setErrorMsg(formatAuthError(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#312C51] text-white flex flex-col justify-between px-4 py-8 relative overflow-hidden select-none">
      {/* Background Ambience */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#48426D]/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#F0C38E]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header with Exact Vedika Logo */}
      <div className="pt-2 text-center relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 rounded-2xl bg-[#48426D]/50 border border-[#F0C38E]/30 p-2 shadow-xl mb-3 flex items-center justify-center backdrop-blur-md">
          <img
            src="https://cdn.phototourl.com/free/2026-08-31-cde583fc-08b8-47ee-ab02-63114e29ce8d.png"
            alt="Vedika LearnHub Logo"
            className="w-full h-full object-contain rounded-xl"
          />
        </div>
        <h1 className="text-2xl font-black tracking-wider text-white font-['Outfit']">
          VEDIKA LEARNHUB
        </h1>
        <p className="text-[11px] text-[#F0C38E] mt-0.5 tracking-widest uppercase font-bold">
          Student Portal
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-sm mx-auto my-auto relative z-10">
        <div className="bg-[#48426D]/80 backdrop-blur-xl border border-[#F0C38E]/20 rounded-3xl p-6 shadow-2xl">
          {/* Segmented Tab Switcher for Login / Register */}
          {mode !== 'forgot' && mode !== 'verify_email' && (
            <div className="flex bg-[#312C51]/80 p-1 rounded-2xl mb-5 border border-[#F0C38E]/10">
              <button
                type="button"
                id="btn-tab-login"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  mode === 'login'
                    ? 'bg-[#F0C38E] text-[#312C51] shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                id="btn-tab-register"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  mode === 'register'
                    ? 'bg-[#F0C38E] text-[#312C51] shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 mb-4 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed ${
                errorMsg.includes('Too many attempts')
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              <AlertCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  errorMsg.includes('Too many attempts') ? 'text-amber-600' : 'text-rose-600'
                }`}
              />
              <div className="flex-1">
                <p className="font-semibold">{errorMsg}</p>
                {errorMsg.includes('Too many attempts') && mode === 'register' && (
                  <p className="mt-1 text-[11px] text-amber-800">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg(null);
                      }}
                      className="text-[#3157D5] underline font-bold hover:text-blue-700 ml-1"
                    >
                      Sign In here
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 leading-relaxed"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">{successMsg}</div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* LOGIN FORM */}
            {mode === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-200 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      id="input-login-email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@vedika.com"
                      autoComplete="email"
                      className="w-full bg-[#312C51]/80 border border-[#F0C38E]/20 focus:border-[#F0C38E] text-white placeholder:text-slate-400 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-200">Password</label>
                    <button
                      type="button"
                      id="btn-forgot-password-link"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] font-bold text-[#F0C38E] hover:text-[#F1AA9B] transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="input-login-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full bg-[#312C51]/80 border border-[#F0C38E]/20 focus:border-[#F0C38E] text-white placeholder:text-slate-400 text-sm rounded-xl pl-10 pr-10 py-2.5 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-login-submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-[#F0C38E] hover:bg-[#F1AA9B] text-[#312C51] font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-3 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Student Panel</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* REGISTRATION FORM */}
            {mode === 'register' && (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      id="input-register-fullname"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#3157D5] focus:bg-white text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      id="input-register-email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      autoComplete="email"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#3157D5] focus:bg-white text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        id="input-register-phone"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765..."
                        autoComplete="tel"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#3157D5] focus:bg-white text-slate-900 text-xs rounded-xl pl-8 pr-2.5 py-2.5 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Class / Target
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        id="select-register-class"
                        value={classGrade}
                        onChange={(e) => setClassGrade(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#3157D5] focus:bg-white text-slate-900 text-xs rounded-xl pl-8 pr-2 py-2.5 outline-none"
                      >
                        <option value="Class 10">Class 10 (Secondary)</option>
                        <option value="Class 11">Class 11 (Higher Sec)</option>
                        <option value="Class 12">Class 12 (Board Prep)</option>
                        <option value="WBJEE / JEE">WBJEE / JEE Prep</option>
                        <option value="NEET">NEET Medical Prep</option>
                        <option value="General Academic">General Academic</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="input-register-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="•••••••• (min. 6 chars)"
                      autoComplete="new-password"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#3157D5] focus:bg-white text-slate-900 text-sm rounded-xl pl-10 pr-10 py-2.5 outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="input-register-confirmpassword"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#3157D5] focus:bg-white text-slate-900 text-sm rounded-xl pl-10 pr-10 py-2.5 outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-register-submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-[#3157D5] hover:bg-blue-600 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Student Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === 'forgot' && (
              <motion.form
                key="forgot"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleForgotSubmit}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-[#3157D5] mb-1">
                  <KeyRound className="w-5 h-5" />
                  <span className="font-bold text-sm">Reset Password</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enter your registered student email address. We will send you a secure link to create a new password.
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      id="input-forgot-email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@vedika.com"
                      autoComplete="email"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#3157D5] focus:bg-white text-slate-900 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    id="btn-forgot-back"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    id="btn-forgot-submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-[#3157D5] hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {/* EMAIL VERIFICATION SCREEN */}
            {mode === 'verify_email' && (
              <motion.div
                key="verify_email"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="text-center py-2 space-y-4"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#3157D5]">
                  <Mail className="w-7 h-7 animate-pulse" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">Check your email</h2>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed px-2">
                    Please verify your email address before continuing. We sent a confirmation link to:
                  </p>
                  <div className="inline-block mt-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-[#3157D5]">
                    {email || 'your registered email'}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 text-left space-y-1">
                  <p>1. Open the verification email from Vedika LearnHub.</p>
                  <p>2. Click on the confirmation link.</p>
                  <p>3. Return here and sign in with your password.</p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    id="btn-resend-verification"
                    onClick={handleResendVerification}
                    disabled={resendStatus === 'sending' || resendStatus === 'sent' || isSubmitting}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {resendStatus === 'sending' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : resendStatus === 'sent' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Verification Email Sent!</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Resend Verification Email</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    id="btn-verify-back-login"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="w-full py-2.5 bg-[#3157D5] hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Back to Login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Footer Branding */}
      <div className="text-center text-[11px] text-slate-400 py-1 relative z-10">
        Vedika LearnHub Student Portal • v2.0
      </div>
    </div>
  );
};
