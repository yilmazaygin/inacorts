import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ReactNode;
}

interface NavGroup {
  titleKey?: string;
  items: NavItem[];
}

interface NavigationProps {
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

const icon = (path: string, extra?: string) => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    {extra && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={extra} />}
  </svg>
);

const item = (path: string, labelKey: string, pathD: string, extra?: string): NavItem => ({
  path,
  labelKey,
  icon: icon(pathD, extra),
});

export const Navigation: React.FC<NavigationProps> = ({ isMobileMenuOpen, onCloseMobileMenu }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const consultantOnly = Boolean(user?.is_sales_consultant && !user?.is_admin);
  const isAdmin = Boolean(user?.is_admin);

  const groups: NavGroup[] = [
    {
      items: [
        item('/admin', 'nav.home', 'M13 10V3L4 14h7v7l9-11h-7z'),
        item('/admin/dashboard', 'nav.dashboard', 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'),
      ],
    },
    {
      titleKey: 'nav.sales',
      items: [
        item('/admin/orders', 'nav.orders', 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'),
        item('/admin/customers', 'nav.customers', 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'),
        item('/admin/contacts', 'nav.contacts', 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'),
      ],
    },
  ];

  if (!consultantOnly) {
    groups.push(
      {
        titleKey: 'nav.stockGroup',
        items: [
          item('/admin/products', 'nav.products', 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'),
          item('/admin/stock', 'nav.stock', 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'),
        ],
      },
      {
        titleKey: 'nav.accounting',
        items: [
          item('/admin/payments', 'nav.payments', 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'),
          item('/admin/expenses', 'nav.expenses', 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'),
          item('/admin/financials', 'nav.financials', 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'),
        ],
      },
    );
  }

  if (isAdmin) {
    groups.push({
      titleKey: 'nav.site',
      items: [
        item('/admin/veriler', 'nav.data', 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'),
        item('/admin/sales-settings', 'nav.salesSettings', 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13'),
        item(
          '/admin/site-settings',
          'nav.siteSettings',
          'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
          'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
        ),
        item('/admin/sozlesme', 'nav.userAgreement', 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'),
        item('/admin/users', 'nav.users', 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'),
      ],
    });
  }

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 dark:bg-opacity-70 lg:hidden"
          onClick={onCloseMobileMenu}
        />
      )}

      <aside
        className={`
          fixed right-0 top-0 z-40 flex h-screen w-64 flex-shrink-0 flex-col overflow-hidden border-l border-gray-200 bg-white transition-transform duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-800
          lg:sticky lg:left-0 lg:right-auto lg:top-[57px] lg:h-[calc(100vh-57px)] lg:border-l-0 lg:border-r
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {groups.map((group) => (
            <div key={group.titleKey ?? 'overview'} className="space-y-1">
              {group.titleKey && (
                <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  {t(group.titleKey)}
                </p>
              )}
              {group.items.map((navItem) => (
                <NavLink
                  key={navItem.path}
                  to={navItem.path}
                  onClick={onCloseMobileMenu}
                  end={navItem.path === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 rounded-lg px-4 py-3 transition-colors ${
                      isActive
                        ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`
                  }
                >
                  {navItem.icon}
                  <span>{t(navItem.labelKey)}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <Link
            to="/"
            onClick={onCloseMobileMenu}
            className="flex items-center space-x-3 rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>{t('nav.goHome')}</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
