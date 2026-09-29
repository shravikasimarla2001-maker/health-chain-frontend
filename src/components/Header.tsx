import React from 'react';
import { Shield, LogOut, User, Globe2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../i18n/translations';

interface HeaderProps {
  onOpenSettings?: () => void;
  onToggleLogs?: () => void;
  logsCount?: number;
}

export const Header: React.FC<HeaderProps> = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const userRole =
    user?.roles && user.roles.length > 0
      ? typeof user.roles[0] === 'string'
        ? user.roles[0]
        : user.roles[0].name
      : t('app.user');

  const userScope = user?.scope_level ? String(user.scope_level).toUpperCase() : 'PLATFORM';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-100 text-base sm:text-lg tracking-tight">
                  {t('app.title')}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded bg-teal-950 text-teal-300 border border-teal-800">
                  {t('app.gov_badge')}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {t('app.subtitle')}
              </p>
            </div>
          </div>

          {/* Right Controls: Language Selector + User Session */}
          <div className="flex items-center space-x-3">
            {/* Top Language Selector */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-950/80 border border-slate-700/80 rounded-lg text-xs">
              <Globe2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label="Select language"
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-slate-900 text-slate-200">
                    {l.flag} {l.nativeName}
                  </option>
                ))}
              </select>
            </div>

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-right">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-100 truncate max-w-[160px]">
                      {user.full_name}
                    </span>
                    <div className="flex items-center space-x-1.5 text-[10px]">
                      <span className="text-teal-400 font-medium">{userRole}</span>
                      <span className="text-slate-600">•</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                        {userScope}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition flex items-center space-x-1.5 text-xs font-medium"
                  title={t('app.sign_out')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('app.sign_out')}</span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-400 font-mono hidden sm:block">
                {t('app.secure_rbac')}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
