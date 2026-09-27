import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { publicSiteApi } from '@/api/publicSite';

const adminPages: Array<[string, string]> = [
  ['/admin/forgot-password', 'auth.forgotPasswordTitle'],
  ['/admin/login', 'auth.login'],
  ['/admin/dashboard', 'nav.dashboard'],
  ['/admin/customers', 'nav.customers'],
  ['/admin/contacts', 'nav.contacts'],
  ['/admin/products', 'nav.products'],
  ['/admin/orders', 'nav.orders'],
  ['/admin/payments', 'nav.payments'],
  ['/admin/stock', 'nav.stock'],
  ['/admin/expenses', 'nav.expenses'],
  ['/admin/financials', 'nav.financials'],
  ['/admin/users', 'nav.users'],
  ['/admin/sales-settings', 'nav.salesSettings'],
  ['/admin/site-settings', 'nav.siteSettings'],
  ['/admin/sozlesme', 'nav.userAgreement'],
  ['/admin/my-account', 'users.myAccount'],
];

function sectionFor(pathname: string, t: TFunction): string {
  if (pathname === '/') return t('site.home');
  if (pathname.startsWith('/urunler')) return t('site.products');
  if (pathname.startsWith('/sepet')) return t('site.cart');
  if (pathname.startsWith('/sozlesme')) return t('site.userAgreement');
  if (pathname.startsWith('/nasil-siparis')) return t('site.howToOrder');
  if (!pathname.startsWith('/admin')) return '';

  const match = adminPages.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const page = match ? t(match[1]) : t('site.admin');
  return `${page} · ${t('site.admin')}`;
}

function iconType(href: string): string {
  if (href.endsWith('.svg')) return 'image/svg+xml';
  if (href.endsWith('.ico')) return 'image/x-icon';
  if (href.endsWith('.webp')) return 'image/webp';
  if (href.endsWith('.gif')) return 'image/gif';
  if (href.endsWith('.jpg') || href.endsWith('.jpeg')) return 'image/jpeg';
  return 'image/png';
}

export const SiteMeta: React.FC = () => {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const [brand, setBrand] = useState('INACORTS');
  const [favicon, setFavicon] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      publicSiteApi.site()
        .then((site) => {
          setBrand(site.company_name?.trim() || 'INACORTS');
          setFavicon(site.favicon_url ?? null);
        })
        .catch(() => undefined);
    };
    load();
    window.addEventListener('site-meta', load);
    return () => window.removeEventListener('site-meta', load);
  }, []);

  useEffect(() => {
    const section = sectionFor(pathname, t);
    document.title = section ? `${section} · ${brand}` : brand;
  }, [pathname, brand, i18n.language, t]);

  useEffect(() => {
    const href = favicon || '/favicon.svg';
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;
    link.type = iconType(href);
  }, [favicon]);

  return null;
};
