import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Default page for `pages --page`.
 *
 * To show a different page on this machine only, add
 * `StandbyPage.local.tsx` beside this file and export `StandbyPage` from it.
 * That file is gitignored. Images for it go in `standby-local/`, which is
 * gitignored too. Rebuild the frontend after adding or changing it.
 */
export const MaintenancePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const title = t('standby.title');
  const turkish = i18n.language.startsWith('tr');

  useEffect(() => {
    document.title = title;
  }, [title]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const languageClass = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
        : 'bg-white text-slate-700 hover:bg-stone-100 dark:bg-slate-800 dark:text-slate-200'
    }`;

  return (
    <div className="relative min-h-screen bg-stone-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="fixed right-4 top-4 z-10 flex items-center gap-2">
        <div className="flex overflow-hidden rounded-md shadow-sm">
          <button type="button" onClick={() => changeLanguage('tr')} className={languageClass(turkish)}>
            TR
          </button>
          <button type="button" onClick={() => changeLanguage('en')} className={languageClass(!turkish)}>
            EN
          </button>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-md bg-white p-2 text-slate-700 shadow-sm hover:bg-stone-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          title={theme === 'light' ? t('common.darkMode') : t('common.lightMode')}
        >
          {theme === 'light' ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>
      </div>

      <main className="flex min-h-screen items-center justify-center px-6 py-24">
        <div className="hero-rise max-w-xl text-center">
          <span aria-hidden className="mx-auto mb-8 block h-1 w-12 bg-amber-500" />
          <h1 className="text-3xl font-medium leading-snug tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {title}
          </h1>
        </div>
      </main>
    </div>
  );
};
