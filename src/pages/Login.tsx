import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { ArrowRight, Lock, Mail, User, Building, AlertCircle, Loader2, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithEmail, signUpWithEmail, error: authStoreError } = useAuthStore();

  const [isSignUp, setIsSignUp] = useState(false);
  const [hasWorkspaceInvite, setHasWorkspaceInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const rawFrom = (location.state as any)?.from?.pathname;
  const from = rawFrom && rawFrom !== '/login' ? rawFrom : '/projects';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setFormError(null);

    const normalizedEmail = email.trim().toLowerCase();
    let success = false;
    if (isSignUp) {
      if (!fullName.trim()) {
        setFormError('Please enter your full name.');
        setLoading(false);
        return;
      }
      if (!hasWorkspaceInvite && !companyName.trim()) {
        setFormError('Please enter your Organization Name, or select "Joining an Invited Team" if your administrator already invited your email.');
        setLoading(false);
        return;
      }
      success = await signUpWithEmail(
        normalizedEmail,
        password,
        fullName.trim(),
        undefined,
        hasWorkspaceInvite ? '' : companyName.trim(),
      );
    } else {
      success = await loginWithEmail(normalizedEmail, password);
    }

    setLoading(false);
    if (success) {
      navigate(from, { replace: true });
    } else {
      setFormError(
        useAuthStore.getState().error ||
          'Authentication failed. Please verify your credentials.',
      );
    }
  };

  const activeError = formError || authStoreError;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-900 dark:text-slate-100 selection:bg-brand-500 selection:text-white transition-colors">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center shadow-xl shadow-brand-500/10 mb-3 group hover:scale-105 transition">
            <img
              src="/jqms-icon.png"
              alt="JQMS Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/favicon.png";
              }}
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">JQMS Enterprise</h1>
            <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-mono text-xs font-bold border border-brand-500/20">
              ISO 9001
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Civil Engineering QA/QC Management Platform</p>
        </div>

        {/* Login / Register Card */}
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl">
          {activeError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{activeError}</span>
            </div>
          )}

          <div className="flex border-b border-slate-200 dark:border-slate-800 pb-3 mb-5 gap-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setFormError(null);
              }}
              className={`text-sm font-bold pb-1 transition ${
                !isSignUp ? 'text-brand-600 dark:text-indigo-400 border-b-2 border-brand-600 dark:border-indigo-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setFormError(null);
              }}
              className={`text-sm font-bold pb-1 transition ${
                isSignUp ? 'text-brand-600 dark:text-indigo-400 border-b-2 border-brand-600 dark:border-indigo-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setHasWorkspaceInvite(false);
                      setFormError(null);
                    }}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      !hasWorkspaceInvite
                        ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>New Organization</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasWorkspaceInvite(true);
                      setFormError(null);
                    }}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      hasWorkspaceInvite
                        ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Invited Staff</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-600 dark:text-indigo-400" />
                    <span>Full Name *</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
                    placeholder="Enter your full name"
                  />
                </div>

                {!hasWorkspaceInvite ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-brand-600 dark:text-indigo-400" />
                      <span>Organization / Company Name *</span>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required={!hasWorkspaceInvite}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
                      placeholder="Enter your company or consultancy name"
                    />
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Creates a dedicated isolated workspace. If your email was pre-invited by an existing team, you will join their workspace automatically.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                    Use the exact work email provisioned by your Quality Director or Project Manager to inherit your assigned company and project permissions.
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-600 dark:text-indigo-400" />
                <span>Work Email Address *</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-brand-600 dark:text-indigo-400" />
                <span>Password *</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Enter password (min. 6 characters)"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 mt-3 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 text-xs text-slate-500 dark:text-slate-500">
          Directly authenticated via Firebase Authentication & Cloud Firestore
        </div>
      </div>
    </div>
  );
};
