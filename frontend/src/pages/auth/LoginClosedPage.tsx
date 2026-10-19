import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBrand } from '@/contexts/BrandContext';
import { useTheme } from '@/contexts/ThemeContext';

interface LoginClosedPageProps {
  message: string;
}

export const LoginClosedPage: React.FC<LoginClosedPageProps> = ({ message }) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const brand = useBrand();
  const text = message.trim() || t('auth.signInClosed');

  useEffect(() => {
    document.title = brand;
  }, [brand]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const languageClass = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? 'bg-primary-600 text-white'
        : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
    }`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 p-4 dark:from-gray-900 dark:to-gray-800">
      <div className="fixed right-4 top-4 z-50 flex items-center space-x-2">
        <div className="flex overflow-hidden rounded-lg shadow-sm">
          <button type="button" onClick={() => changeLanguage('tr')} className={languageClass(i18n.language === 'tr')}>
            TR
          </button>
          <button type="button" onClick={() => changeLanguage('en')} className={languageClass(i18n.language === 'en')}>
            EN
          </button>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg bg-white p-2 text-gray-700 shadow-sm transition-colors hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
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

      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl dark:bg-gray-800">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">{brand}</h1>
        </div>
        <p className="whitespace-pre-wrap break-words text-center text-base leading-relaxed text-gray-800 dark:text-gray-100">
          {text}
        </p>
        <Link
          to="/"
          className="mt-8 block w-full rounded-lg bg-gray-200 px-4 py-2 text-center text-base font-medium text-gray-900 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          {t('nav.goHome')}
        </Link>
      </div>
    </div>
  );
};
