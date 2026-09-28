import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/layout/BackButton';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { reportsApi, type FinancialPeriod, type FinancialReport } from '@/api/reports';
import { formatCurrency, formatCompactCurrency } from '@/utils/format';

type Period = 'lastMonth' | 'lastYear' | 'allTime';

const periodParam: Record<Period, FinancialPeriod> = {
  lastMonth: 'last_month',
  lastYear: 'last_year',
  allTime: 'all_time',
};

interface PeriodData {
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
}

interface CategoryBreakdownRow {
  categoryId: number;
  categoryName: string;
  amount: number;
}

interface SaleInsight {
  orderId: number;
  customerName: string;
  value: number;
  label: string;
}

const emptyPeriod: PeriodData = { revenue: 0, expenses: 0, netProfit: 0, profitMargin: 0 };

export const FinancialsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activePeriod, setActivePeriod] = useState<Period>('lastMonth');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState<FinancialReport | null>(null);

  useEffect(() => {
    loadData();
  }, [activePeriod]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      setReport(await reportsApi.financials(periodParam[activePeriod]));
    } catch (err: any) {
      setError(err.response?.data?.detail || t('errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const current: PeriodData = report
    ? {
        revenue: report.revenue,
        expenses: report.expenses,
        netProfit: report.net_profit,
        profitMargin: report.profit_margin,
      }
    : emptyPeriod;

  const categoryBreakdown: CategoryBreakdownRow[] = (report?.category_breakdown ?? []).map((row) => ({
    categoryId: row.category_id,
    categoryName: row.category_name,
    amount: row.amount,
  }));

  const insight = (item: FinancialReport['highest_line_items'], label: string): SaleInsight | null => {
    if (!item) return null;
    return {
      orderId: item.order_id,
      customerName: `${t('orders.orderNumber')}${item.order_id}`,
      value: item.value,
      label,
    };
  };

  const topSalesInsights = report && (report.highest_line_items || report.highest_volume || report.highest_quantity)
    ? {
        highestLineItems: insight(report.highest_line_items, t('financials.lineItems', { count: report.highest_line_items?.value ?? 0 })),
        highestVolume: insight(report.highest_volume, formatCurrency(report.highest_volume?.value ?? 0)),
        highestProfit: insight(report.highest_quantity, t('financials.totalQuantity', { count: report.highest_quantity?.value ?? 0 })),
      }
    : null;

  const periods: { key: Period; label: string }[] = [
    { key: 'lastMonth', label: t('financials.lastMonth') },
    { key: 'lastYear', label: t('financials.lastYear') },
    { key: 'allTime', label: t('financials.allTime') },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-1">
            <BackButton />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('financials.title')}</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('financials.subtitle')}</p>
        </div>

        {error && <ErrorMessage message={error} onRetry={loadData} />}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Period Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {periods.map((period) => (
                <button
                  key={period.key}
                  onClick={() => setActivePeriod(period.key)}
                  className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-colors ${
                    activePeriod === period.key
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card padding={false}>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('financials.revenue')}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 truncate" title={formatCurrency(current.revenue)}>{formatCompactCurrency(current.revenue)}</p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg flex-shrink-0 ml-3">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Card>

              <Card padding={false}>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('financials.expenses')}</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1 truncate" title={formatCurrency(current.expenses)}>{formatCompactCurrency(current.expenses)}</p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg flex-shrink-0 ml-3">
                      <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Card>

              <Card padding={false}>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('financials.netProfit')}</p>
                      <p className={`text-2xl font-bold mt-1 truncate ${current.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} title={formatCurrency(current.netProfit)}>
                        {formatCompactCurrency(current.netProfit)}
                      </p>
                    </div>
                    <div className={`${current.netProfit >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} p-3 rounded-lg flex-shrink-0 ml-3`}>
                      <svg className={`w-6 h-6 ${current.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Card>

              <Card padding={false}>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('financials.profitMargin')}</p>
                      <p className={`text-2xl font-bold mt-1 truncate ${current.profitMargin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        %{current.profitMargin.toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg flex-shrink-0 ml-3">
                      <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Category-based Expense Breakdown */}
            {categoryBreakdown.length > 0 && (
              <Card title={t('financials.categoryBreakdown')}>
                <div className="overflow-x-auto overflow-y-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('expenses.category')}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('expenses.amount')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {categoryBreakdown.map((row) => (
                        <tr key={row.categoryId}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{row.categoryName}</td>
                          <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">
                            {formatCurrency(row.amount)}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 dark:bg-gray-800/50">
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-gray-100">{t('common.total')}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(current.expenses)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Top Sales Insights */}
            {topSalesInsights && (
              <Card title={t('financials.topSalesInsights')}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topSalesInsights.highestLineItems && (
                    <div
                      onClick={() => navigate(`/admin/orders/${topSalesInsights.highestLineItems!.orderId}`)}
                      className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">{t('financials.highestLineItems')}</h4>
                      </div>
                      <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{topSalesInsights.highestLineItems.label}</p>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">{topSalesInsights.highestLineItems.customerName}</p>
                    </div>
                  )}

                  {topSalesInsights.highestVolume && (
                    <div
                      onClick={() => navigate(`/admin/orders/${topSalesInsights.highestVolume!.orderId}`)}
                      className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 className="text-sm font-semibold text-green-800 dark:text-green-300">{t('financials.highestVolume')}</h4>
                      </div>
                      <p className="text-xl font-bold text-green-900 dark:text-green-100">{topSalesInsights.highestVolume.label}</p>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">{topSalesInsights.highestVolume.customerName}</p>
                    </div>
                  )}

                  {topSalesInsights.highestProfit && (
                    <div
                      onClick={() => navigate(`/admin/orders/${topSalesInsights.highestProfit!.orderId}`)}
                      className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300">{t('financials.highestQuantity')}</h4>
                      </div>
                      <p className="text-xl font-bold text-purple-900 dark:text-purple-100">{topSalesInsights.highestProfit.label}</p>
                      <p className="text-sm text-purple-700 dark:text-purple-400 mt-1">{topSalesInsights.highestProfit.customerName}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};
