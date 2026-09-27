import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';
import type { SiteContent } from '@/types/site';

interface SiteChromeProps {
  content: SiteContent | null;
  children: React.ReactNode;
}

export const SiteChrome: React.FC<SiteChromeProps> = ({ content, children }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const name = content?.company_name || 'INACORTS';

  const isTurkish = i18n.language.startsWith('tr');

  const toggleLanguage = () => {
    const next = isTurkish ? 'en' : 'tr';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
  };

  const infoLinks = [
    { to: '/', hash: '', label: t('site.home') },
    { to: '/#hakkimizda', hash: 'hakkimizda', label: t('site.about') },
    { to: '/#iletisim', hash: 'iletisim', label: t('site.contact') },
  ];

  const scrollToSection = (hash: string) => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const section = document.getElementById(hash);
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  const openSection = (hash: string) => {
    close();
    const samePage = location.pathname === '/';
    if (!samePage) {
      navigate(hash ? { pathname: '/', hash } : '/');
      return;
    }
    if ((location.hash || '') !== (hash ? `#${hash}` : '')) {
      navigate(hash ? { pathname: '/', hash } : '/', { replace: true });
    }
    window.setTimeout(() => scrollToSection(hash), 0);
  };
  const shopLinks = [
    { to: '/urunler', label: t('site.products'), cart: false },
    { to: '/sepet', label: t('site.myCart'), cart: true },
  ];

  const close = () => setOpen(false);

  return (
    <div className="min-h-screen bg-stone-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="site-nav border-b border-stone-200 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-950 dark:text-white">
        <div className="relative h-16">
        <Link
          to="/sepet"
          className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-slate-700 hover:bg-stone-100 dark:text-slate-200 dark:hover:bg-white/10"
          aria-label={t('site.cart')}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
          </svg>
          {count > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-slate-950">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Link>
        <Link
          to="/"
          onClick={(event) => {
            event.preventDefault();
            openSection('');
          }}
          className="absolute left-1/2 top-0 flex h-16 max-w-[70%] -translate-x-1/2 items-center truncate text-lg font-semibold tracking-tight"
        >
          {name}
        </Link>
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-700 hover:bg-stone-100 dark:text-slate-200 dark:hover:bg-white/10"
          onClick={() => setOpen((value) => !value)}
          aria-label="Menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        </div>
      </header>

      <button
        type="button"
        aria-label={t('common.close')}
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <nav
        className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-white text-slate-900 shadow-xl transition-transform duration-300 dark:bg-slate-950 dark:text-white ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-stone-200 px-3 dark:border-white/10">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-stone-100 dark:text-slate-200 dark:hover:bg-white/10"
              aria-label={t('common.language')}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" />
              </svg>
              <span>{isTurkish ? 'Türkçe' : 'English'}</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-md p-1.5 text-slate-700 hover:bg-stone-100 dark:text-slate-200 dark:hover:bg-white/10"
              aria-label={theme === 'light' ? t('common.darkMode') : t('common.lightMode')}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>
          </div>
          <button type="button" onClick={close} className="rounded-md p-2 text-slate-700 hover:bg-stone-100 dark:text-slate-200 dark:hover:bg-white/10" aria-label={t('common.close')}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col px-2 py-3">
          {infoLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={(event) => {
                event.preventDefault();
                openSection(link.hash);
              }}
              className="rounded-md px-3 py-3 text-sm text-slate-800 hover:bg-stone-100 dark:text-slate-100 dark:hover:bg-white/10"
            >
              {link.label}
            </Link>
          ))}
          <div className="mx-3 my-2 h-px bg-stone-200 dark:bg-white/15" />
          {shopLinks.map((link) => (
            <Link key={link.to} to={link.to} onClick={close} className="rounded-md px-3 py-3 text-sm text-slate-800 hover:bg-stone-100 dark:text-slate-100 dark:hover:bg-white/10">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="overflow-x-clip">
      <main>{children}</main>

      <footer className="border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-semibold text-slate-900 dark:text-white">{name}</p>
          <div className="text-sm sm:text-right">
            <Link to="/sozlesme" className="block text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              {t('site.userAgreement')}
            </Link>
            <Link to="/admin/login" className="mt-2 inline-block text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              {t('site.admin')}
            </Link>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
};
