import React, { useState } from 'react';
import { Shield, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, User, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginPageProps {
  onForgotPassword: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onForgotPassword }) => {
  const { login, isLoading, error, clearError } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [localError, setLocalError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();
    if (!email.trim()) { setLocalError('Please enter your email address'); return; }
    if (!password) { setLocalError('Please enter your password'); return; }
    const result = await login({ email, password, rememberMe });
    if (!result.success && result.error) setLocalError(result.error);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();
    if (!name.trim()) { setLocalError('Please enter your name'); return; }
    if (!email.trim()) { setLocalError('Please enter your email'); return; }
    if (!companyName.trim()) { setLocalError('Please enter your company name'); return; }
    if (!password || password.length < 6) { setLocalError('Password must be at least 6 characters'); return; }

    setRegisterLoading(true);
    try {
      const { useAuthStore } = await import('@/stores/authStore');
      const result = await useAuthStore.getState().register(name, email, password, companyName);
      if (!result.success && result.error) setLocalError(result.error);
    } finally {
      setRegisterLoading(false);
    }
  };

  const displayError = localError || error;
  const loading = isLoading || registerLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-800 rounded-2xl shadow-lg shadow-amber-700/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ComplianceHub</h1>
          <p className="text-amber-200">KYC & AML Management Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setLocalError(''); clearError(); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >Sign In</button>
            <button
              onClick={() => { setMode('register'); setLocalError(''); clearError(); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >Register</button>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
            <p className="text-gray-500 mt-1">{mode === 'login' ? 'Sign in to your account to continue' : 'Set up your organization and start verifying'}</p>
          </div>

          {displayError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">{mode === 'login' ? 'Authentication Failed' : 'Registration Failed'}</p>
                <p className="text-sm text-red-600 mt-0.5">{displayError}</p>
              </div>
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-5">
            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none transition-all" disabled={loading} />
                  </div>
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input id="company" type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Corp" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none transition-all" disabled={loading} />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none transition-all" disabled={loading} />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'register' ? 'Min 6 characters' : 'Enter your password'} className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none transition-all" disabled={loading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-amber-800 focus:ring-amber-700" disabled={loading} />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button type="button" onClick={onForgotPassword} className="text-sm text-amber-800 hover:text-amber-900 font-medium" disabled={loading}>Forgot password?</button>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 bg-amber-800 text-white rounded-lg font-semibold hover:bg-amber-900 focus:ring-4 focus:ring-amber-700/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" />{mode === 'login' ? 'Signing in...' : 'Creating account...'}</>
              ) : (
                <>{mode === 'login' ? 'Sign In' : 'Create Account'}<ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-amber-200 text-sm mt-6">Protected by enterprise-grade security</p>
      </div>
    </div>
  );
};

export default LoginPage;
