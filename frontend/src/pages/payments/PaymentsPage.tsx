import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Table } from '@/components/common/Table';
import { Pagination } from '@/components/common/Pagination';
import { paymentsApi } from '@/api/payments';
import { ordersApi } from '@/api/orders';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Payment, Order } from '@/types/entities';
import { PaymentMethod } from '@/types/enums';

export const PaymentsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [paymentsData, ordersData] = await Promise.all([
        paymentsApi.list({ page, page_size: 20 }),
        ordersApi.list({ page_size: 1000 }),
      ]);

      setPayments(paymentsData.items);
      setTotalPages(paymentsData.total_pages);
      setOrders(ordersData.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderInfo = (orderId: number) => {
    return orders.find((o) => o.id === orderId);
  };

  const getMethodBadge = (method: PaymentMethod) => {
    const variants: Record<PaymentMethod, 'success' | 'info' | 'warning' | 'default'> = {
      [PaymentMethod.CASH]: 'success',
      [PaymentMethod.BANK_TRANSFER]: 'info',
      [PaymentMethod.CREDIT_CARD]: 'warning',
      [PaymentMethod.OTHER]: 'default',
    };
    const labels: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: t('payments.methodCash'),
      [PaymentMethod.BANK_TRANSFER]: t('payments.methodBankTransfer'),
      [PaymentMethod.CREDIT_CARD]: t('payments.methodCreditCard'),
      [PaymentMethod.OTHER]: t('payments.methodOther'),
    };
    return <Badge variant={variants[method]} size="sm">{labels[method]}</Badge>;
  };

  const columns = [
    { key: 'id', header: 'ID', className: 'w-20' },
    {
      key: 'order',
      header: t('payments.order'),
      render: (p: Payment) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/orders/${p.order_id}`);
          }}
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          {t('orders.orderNumber')} #{p.order_id}
        </button>
      ),
    },
    { key: 'amount', header: t('payments.amount'), render: (p: Payment) => formatCurrency(p.amount) },
    { key: 'method', header: t('payments.method'), render: (p: Payment) => getMethodBadge(p.method) },
    {
      key: 'received_by',
      header: t('payments.receivedBy'),
      render: (p: Payment) => (
        p.received_by_username ? (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">{p.received_by_username}</span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    { key: 'created_at', header: t('payments.date'), render: (p: Payment) => formatDate(p.created_at) },
    {
      key: 'order_total',
      header: t('payments.orderTotal'),
      render: (p: Payment) => {
        const order = getOrderInfo(p.order_id);
        return order ? formatCurrency(order.total_amount) : '-';
      },
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('payments.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('payments.subtitle')}</p>
        </div>

        <Card>
          {error && <ErrorMessage message={error} onRetry={loadData} />}

          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <Table columns={columns} data={payments} />
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};
