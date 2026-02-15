import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Badge } from '@/components/common/Badge';
import { ordersApi } from '@/api/orders';
import { productsApi } from '@/api/products';
import { customersApi } from '@/api/customers';
import { paymentsApi } from '@/api/payments';
import { expensesApi } from '@/api/expenses';
import { formatCurrency, formatCompactCurrency, formatDate } from '@/utils/format';
import { Order } from '@/types/entities';
import { OrderStatus, PaymentStatus, DeliveryStatus } from '@/types/enums';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [ordersData, productsData, customersData, paymentsData, expensesData] = await Promise.all([
        ordersApi.list({ page: 1, page_size: 10, sort: 'id', order: 'desc' }),
        productsApi.list({ page: 1, page_size: 1 }),
        customersApi.list({ page: 1, page_size: 1 }),
        paymentsApi.list({ page: 1, page_size: 1000 }),
        expensesApi.list({ page_size: 10000 }),
      ]);

      const totalRevenue = paymentsData.items.reduce((sum, p) => sum + p.amount, 0);
      const totalExpenses = expensesData.items.reduce((sum, e) => sum + e.amount, 0);

      setStats({
        totalOrders: ordersData.total,
        totalProducts: productsData.total,
        totalCustomers: customersData.total,
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
      });

      setRecentOrders(ordersData.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderStatusBadge = (order: Order) => {
    if (order.order_status === OrderStatus.CANCELED) {
      return <Badge variant="danger">{t('orders.statusCanceled')}</Badge>;
    }
    if (order.order_status === OrderStatus.COMPLETED) {
      return <Badge variant="success">{t('orders.statusCompleted')}</Badge>;
    }
    if (order.payment_status === PaymentStatus.PAID && order.delivery_status === DeliveryStatus.DELIVERED) {
      return <Badge variant="success">{t('orders.readyToComplete')}</Badge>;
    }
    if (order.payment_status === PaymentStatus.UNPAID) {
      return <Badge variant="warning">{t('orders.awaitingPayment')}</Badge>;
    }
    if (order.delivery_status === DeliveryStatus.NOT_DELIVERED) {
      return <Badge variant="info">{t('orders.awaitingDelivery')}</Badge>;
    }
    return <Badge variant="default">{t('orders.inProgress')}</Badge>;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('dashboard.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('dashboard.welcome')}</p>
        </div>

        {error && <ErrorMessage message={error} onRetry={loadDashboardData} />}

        {/* Stats Grid - Mobile optimized with consistent spacing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding={false}>
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.totalOrders')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 truncate">{stats.totalOrders}</p>
                </div>
                <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg flex-shrink-0 ml-3">
                  <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>

          <Card padding={false}>
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.totalProducts')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 truncate">{stats.totalProducts}</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg flex-shrink-0 ml-3">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>

          <Card padding={false}>
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.totalCustomers')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 truncate">{stats.totalCustomers}</p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg flex-shrink-0 ml-3">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>

          <Card padding={false}>
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('dashboard.cumulativeProfit')}</p>
                  <p className={`text-2xl font-bold mt-1 truncate ${stats.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} title={formatCurrency(stats.netProfit)}>{formatCompactCurrency(stats.netProfit)}</p>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg flex-shrink-0 ml-3">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Orders - Mobile optimized with consistent card heights */}
        <Card title={t('dashboard.recentOrders')}>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('dashboard.noOrders')}</p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750/50 cursor-pointer transition-colors"
                >
                  {/* Mobile-first layout: stack on small screens, side-by-side on larger */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{t('orders.orderNumber')} #{order.id}</span>
                        {getOrderStatusBadge(order)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
                        {formatDate(order.created_at)} • {order.items.length} {t('dashboard.items')}
                      </p>
                    </div>
                    <div className="flex-shrink-0 sm:text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg sm:text-base">{formatCurrency(order.total_amount)}</p>
                      {/* Badge container with proper wrapping on mobile */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant={order.payment_status === PaymentStatus.PAID ? 'success' : 'warning'} size="sm">
                          {order.payment_status === PaymentStatus.PAID ? t('orders.paymentStatusPaid') : order.payment_status === PaymentStatus.PARTIALLY_PAID ? t('orders.paymentStatusPartial') : t('orders.paymentStatusUnpaid')}
                        </Badge>
                        <Badge variant={order.delivery_status === DeliveryStatus.DELIVERED ? 'success' : 'info'} size="sm">
                          {order.delivery_status === DeliveryStatus.DELIVERED ? t('orders.deliveryStatusDelivered') : order.delivery_status === DeliveryStatus.PARTIALLY_DELIVERED ? t('orders.deliveryStatusPartial') : t('orders.deliveryStatusPending')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {recentOrders.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => navigate('/orders')}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm"
              >
                {t('dashboard.viewAllOrders')} →
              </button>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};
