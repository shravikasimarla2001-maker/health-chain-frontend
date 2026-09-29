import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Building,
  Check,
  AlertCircle,
  Stethoscope,
  Globe,
  MapPin,
  Building2,
  Server,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SEED_ACCOUNTS, DEFAULT_PASSWORD } from '../data/seedAccounts';
import { ForgotPasswordModal } from './screens/common/ForgotPasswordModal';
import { useLanguage } from '../context/LanguageContext';

export const LoginScreen: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState<string>('superadmin@hsc.gov.in');
  const [password, setPassword] = useState<string>(DEFAULT_PASSWORD);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedRoleIndex, setSelectedRoleIndex] = useState<number>(0);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await login(email, password);
    } catch {
      // Handled in context
    }
  };

  const handleSelectAccount = (index: number) => {
    const acc = SEED_ACCOUNTS[index];
    setSelectedRoleIndex(index);
    setEmail(acc.email);
    setPassword(DEFAULT_PASSWORD);
  };

  const currentAccount = SEED_ACCOUNTS[selectedRoleIndex] || SEED_ACCOUNTS[0];

  const getScopeIcon = (scope: string) => {
    switch (scope.toUpperCase()) {
      case 'PLATFORM':
        return <Server className="w-4 h-4 text-purple-400" />;
      case 'NATIONAL':
        return <Globe className="w-4 h-4 text-blue-400" />;
      case 'STATE':
        return <Building2 className="w-4 h-4 text-indigo-400" />;
      case 'DISTRICT':
        return <MapPin className="w-4 h-4 text-emerald-400" />;
      case 'PHC':
      default:
        return <Stethoscope className="w-4 h-4 text-teal-400" />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Header & Introduction */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>{t('app.gov_badge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {t('login.title')}
          </h1>
          <p className="text-sm text-slate-400">
            {t('login.subtitle')}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
          
          {/* Role & Platform Scope Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {t('login.demo_accounts')}
              </label>
              <span className="text-xs text-slate-500">Click to auto-fill credentials</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SEED_ACCOUNTS.map((acc, index) => {
                const isSelected = selectedRoleIndex === index;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectAccount(index)}
                    className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between space-y-2 text-xs relative ${
                      isSelected
                        ? 'bg-teal-500/15 border-teal-500 text-teal-200 ring-2 ring-teal-500/30 shadow-md'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getScopeIcon(acc.scope)}
                        <span className="font-semibold text-slate-100 text-sm">{acc.role}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono border ${
                          isSelected
                            ? 'bg-teal-950 border-teal-700 text-teal-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        {acc.scope}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {acc.description}
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono truncate pt-1 border-t border-slate-800/80">
                      {acc.email}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Role & Platform Scope Summary Strip */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Current Role:</span>
              <span className="font-bold text-slate-100">{currentAccount.role}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Platform Scope:</span>
              <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 font-mono font-bold text-[11px]">
                {currentAccount.scope} ({currentAccount.tier})
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              User: <strong className="text-slate-200">{currentAccount.name}</strong>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t('login.email_label')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@hsc.gov.in"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    {t('login.password_label')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-[11px] text-teal-400 hover:text-teal-300 underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="space-y-0.5">
                  <span className="font-semibold">Sign In Failed</span>
                  <p className="text-[11px] text-rose-200/90">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800/50 text-white font-semibold text-sm transition shadow-lg shadow-teal-900/30 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('login.signing_in')}</span>
                </>
              ) : (
                <>
                  <span>{t('login.signin_btn')} ({currentAccount.role})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div>
  );
};
