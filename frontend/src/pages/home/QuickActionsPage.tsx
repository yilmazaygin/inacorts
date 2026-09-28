import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

interface Action {
  to: string;
  labelKey: string;
  hintKey: string;
  icon: React.ReactNode;
}

const icon = (path: string) => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

export const QuickActionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const consultantOnly = Boolean(user?.is_sales_consultant && !user?.is_admin);

  const groups: Array<{ titleKey: string; actions: Action[] }> = [
    {
      titleKey: 'home.customersOrders',
      actions: [
        {
          to: '/admin/customers?yeni=1',
          labelKey: 'home.addCustomer',
          hintKey: 'home.addCustomerHint',
          icon: icon('M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'),
        },
        {
          to: '/admin/orders?yeni=1',
          labelKey: 'home.createOrder',
          hintKey: 'home.createOrderHint',
          icon: icon('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'),
        },
      ],
    },
    {
      titleKey: 'home.stock',
      actions: [
        {
          to: '/admin/stock?yeni=1',
          labelKey: 'home.addStock',
          hintKey: 'home.addStockHint',
          icon: icon('M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'),
        },
        {
          to: '/admin/stock',
          labelKey: 'home.stockList',
          hintKey: 'home.stockListHint',
          icon: icon('M4 6h16M4 10h16M4 14h16M4 18h16'),
        },
      ],
    },
    {
      titleKey: 'home.accounting',
      actions: [
        {
          to: '/admin/expenses?yeni=1',
          labelKey: 'home.addExpense',
          hintKey: 'home.addExpenseHint',
          icon: icon('M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'),
        },
        {
          to: '/admin/payments',
          labelKey: 'home.payments',
          hintKey: 'home.paymentsHint',
          icon: icon('M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'),
        },
        {
          to: '/admin/financials',
          labelKey: 'home.financials',
          hintKey: 'home.financialsHint',
          icon: icon('M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'),
        },
      ],
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('home.title')}</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{t('home.subtitle')}</p>
        </div>

        {groups.filter((group) => !consultantOnly || group.titleKey === 'home.customersOrders').map((group) => (
          <section key={group.titleKey} className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t(group.titleKey)}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {group.actions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
                >
                  <span className="rounded-lg bg-primary-100 p-2 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                    {action.icon}
                  </span>
                  <span>
                    <span className="block font-medium text-gray-900 dark:text-white">{t(action.labelKey)}</span>
                    <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">{t(action.hintKey)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppLayout>
  );
};
