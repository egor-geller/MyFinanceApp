import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePrivacy } from '../context/PrivacyContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const { privacyMode, togglePrivacy } = usePrivacy();
  const { t } = useTranslation();

  return (
    <nav className="sticky top-0 z-40 border-b border-white/60 bg-white/75 px-4 py-3 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/70 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-sky-500 text-sm font-black text-white shadow-lg shadow-amber-500/20">
            FA
          </span>
          <div className="leading-tight">
            <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white">FinanceApp</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('nav.tagline')}</div>
          </div>
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
          <Link to="/" className="rounded-full px-3 py-2 text-slate-600 transition-colors hover:bg-white/80 hover:text-amber-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-amber-300">{t('nav.dashboard')}</Link>
          <Link to="/archive" className="rounded-full px-3 py-2 text-slate-600 transition-colors hover:bg-white/80 hover:text-amber-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-amber-300">{t('nav.archive')}</Link>
          <Link to="/profile" className="rounded-full px-3 py-2 text-slate-600 transition-colors hover:bg-white/80 hover:text-amber-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-amber-300">{t('nav.profile')}</Link>

          <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

          <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-2 py-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
        <button
          onClick={togglePrivacy}
          className={`rounded-full p-2 transition-colors ${privacyMode ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/70 dark:text-amber-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
          aria-label="Toggle privacy mode"
        >
          <span className="flex items-center gap-1.5">
            {privacyMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            )}
            <span className="text-xs font-medium">{t('nav.privacy')}</span>
          </span>
        </button>
        <button
          onClick={toggle}
          className="rounded-full bg-slate-100 p-2 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
          aria-label="Toggle dark mode"
        >
          {dark ? '☀️' : '🌙'}
        </button>
          </div>

          <div className="rounded-full border border-white/60 bg-white/80 px-3 py-2 text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300">
            {user?.name}
          </div>

          <button onClick={logout} className="rounded-full px-3 py-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40">
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </nav>
  );
}
