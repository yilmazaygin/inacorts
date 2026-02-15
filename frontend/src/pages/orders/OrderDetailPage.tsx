import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Badge } from '@/components/common/Badge';
import { NotesPanel } from '@/components/common/NotesPanel';
import { ordersApi } from '@/api/orders';
import { orderDeliveriesApi } from '@/api/orderDeliveries';
import { paymentsApi } from '@/api/payments';
import { customersApi } from '@/api/customers';
import { productsApi } from '@/api/products';
import { formatCurrency, formatDate, getErrorMessage } from '@/utils/format';
import type { Order, Payment, PaymentCreate, Customer, Product, OrderDelivery } from '@/types/entities';
import { OrderStatus, PaymentStatus, DeliveryStatus, PaymentMethod, EntityType } from '@/types/enums';

export const OrderDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deliveries, setDeliveries] = useState<OrderDelivery[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [deliveryQuantity, setDeliveryQuantity] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [paymentFormData, setPaymentFormData] = useState<PaymentCreate>({
    order_id: 0,
    amount: 0,
    method: PaymentMethod.CASH,
  });

  useEffect(() => {
    if (id) {
      loadOrderData();
    }
  }, [id]);

  const loadOrderData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const orderId = parseInt(id!);

      const orderData = await ordersApi.get(orderId);
      const paymentsData = await paymentsApi.list({ order_id: orderId, page_size: 1000 });
      const deliveriesData = await orderDeliveriesApi.list(orderId);
      const customerData = await customersApi.get(orderData.customer_id);
      const productsData = await productsApi.list({ page_size: 1000 });

      setOrder(orderData);
      setPayments(paymentsData.items);
      setDeliveries(deliveriesData);
      setCustomer(customerData);
      setProducts(productsData.items);

      const remaining = orderData.total_amount - paymentsData.items.reduce((sum, p) => sum + p.amount, 0);
      setPaymentFormData({
        order_id: orderId,
        amount: Math.max(0, remaining),
        method: PaymentMethod.CASH,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load order data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await paymentsApi.create(paymentFormData);
      setShowPaymentModal(false);
      await loadOrderData();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to add payment'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeliver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;

    try {
      setIsSubmitting(true);
      await ordersApi.deliverItem(selectedItemId, { quantity: deliveryQuantity });
      setShowDeliveryModal(false);
      setSelectedItemId(null);
      setDeliveryQuantity(0);
      await loadOrderData();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to deliver items'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm(t('orders.confirmCancel'))) return;

    try {
      await ordersApi.cancel(parseInt(id!));
      await loadOrderData();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to cancel order'));
    }
  };

  const openDeliveryModal = (itemId: number, maxQuantity: number) => {
    setSelectedItemId(itemId);
    setDeliveryQuantity(maxQuantity);
    setShowDeliveryModal(true);
  };

  const getProductName = (productId: number) => {
    return products.find((p) => p.id === productId)?.name || `#${productId}`;
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = order ? order.total_amount - totalPaid : 0;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !order || !customer) {
    return (
      <AppLayout>
        <ErrorMessage message={error || 'Order not found'} />
      </AppLayout>
    );
  }

  const paymentMethodOptions = [
    { value: PaymentMethod.CASH, label: t('payments.methodCash') },
    { value: PaymentMethod.BANK_TRANSFER, label: t('payments.methodBankTransfer') },
    { value: PaymentMethod.CREDIT_CARD, label: t('payments.methodCreditCard') },
    { value: PaymentMethod.OTHER, label: t('payments.methodOther') },
  ];

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    const labels: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: t('payments.methodCash'),
      [PaymentMethod.BANK_TRANSFER]: t('payments.methodBankTransfer'),
      [PaymentMethod.CREDIT_CARD]: t('payments.methodCreditCard'),
      [PaymentMethod.OTHER]: t('payments.methodOther'),
    };
    return labels[method] || method;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/orders')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('orders.orderNumber')}{order.id}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={order.order_status === OrderStatus.COMPLETED ? 'success' : order.order_status === OrderStatus.CANCELED ? 'danger' : 'default'}>
                  {order.order_status === OrderStatus.COMPLETED ? t('orders.statusCompleted') : order.order_status === OrderStatus.CANCELED ? t('orders.statusCanceled') : t('orders.statusOpen')}
                </Badge>
                <Badge variant={order.payment_status === PaymentStatus.PAID ? 'success' : 'warning'} size="sm">
                  {order.payment_status === PaymentStatus.PAID ? t('orders.paymentStatusPaid') : order.payment_status === PaymentStatus.PARTIALLY_PAID ? t('orders.paymentStatusPartial') : t('orders.paymentStatusUnpaid')}
                </Badge>
                <Badge variant={order.delivery_status === DeliveryStatus.DELIVERED ? 'success' : 'info'} size="sm">
                  {order.delivery_status === DeliveryStatus.DELIVERED ? t('orders.deliveryStatusDelivered') : order.delivery_status === DeliveryStatus.PARTIALLY_DELIVERED ? t('orders.deliveryStatusPartial') : t('orders.deliveryStatusPending')}
                </Badge>
              </div>
            </div>
          </div>
          {order.order_status === OrderStatus.OPEN && (
            <Button variant="danger" onClick={handleCancelOrder}>
              {t('common.cancelOrder')}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title={t('orders.orderDetails')}>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('orders.customer')}</label>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">{customer.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{customer.address}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('orders.orderDate')}</label>
                    <p className="text-gray-900 dark:text-gray-100">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('orders.totalAmount')}</label>
                    <p className="text-gray-900 dark:text-gray-100 font-bold text-lg">{formatCurrency(order.total_amount)}</p>
                  </div>
                </div>
                {order.created_by_username && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('orders.createdBy')}</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.created_by_username}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card title={t('orders.orderItems')}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">{t('common.product')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">{t('common.quantity')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">{t('orders.delivered')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">{t('common.price')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">{t('common.total')}</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {order.items.map((item) => {
                      const remaining = item.quantity - item.delivered_quantity;
                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">{getProductName(item.product_id)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">
                            <span className={item.delivered_quantity === item.quantity ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                              {item.delivered_quantity}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-200">{formatCurrency(item.quantity * item.unit_price)}</td>
                          <td className="px-4 py-2 text-sm">
                            {remaining > 0 && order.order_status === OrderStatus.OPEN && (
                              <button
                                onClick={() => openDeliveryModal(item.id, remaining)}
                                className="text-primary-600 hover:text-primary-700 font-medium"
                              >
                                {t('common.deliver')}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Delivery History */}
            <Card title={t('orders.deliveryHistory')}>
              {deliveries.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                  {t('orders.noDeliveries')}
                </p>
              ) : (
                <div className="space-y-2">
                  {deliveries.map((delivery) => (
                    <div key={delivery.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {formatDate(delivery.delivered_at)}
                            </span>
                          </div>
                          {delivery.delivered_by_username && (
                            <div className="flex items-center space-x-2 mt-1.5 ml-6">
                              <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {t('orders.deliveredBy')}: <span className="font-medium">{delivery.delivered_by_username}</span>
                              </span>
                            </div>
                          )}
                          {delivery.note && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-6">{delivery.note}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card title={t('payments.paymentSummary')}>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('orders.totalAmount')}:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{formatCurrency(order.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('payments.paid')}:</span>
                  <span className="text-green-600 font-medium">{formatCurrency(totalPaid)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{t('payments.remaining')}:</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{formatCurrency(remainingAmount)}</span>
                </div>
                {remainingAmount > 0 && order.order_status === OrderStatus.OPEN && (
                  <Button onClick={() => setShowPaymentModal(true)} fullWidth>
                    {t('payments.addPayment')}
                  </Button>
                )}
              </div>
            </Card>

            <Card title={t('payments.paymentHistory')}>
              {payments.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">{t('orders.noPayments')}</p>
              ) : (
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{getPaymentMethodLabel(payment.method)}</p>
                          {payment.received_by_username && (
                            <div className="flex items-center space-x-1.5 mt-1.5">
                              <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {t('payments.receivedBy')}: <span className="font-medium">{payment.received_by_username}</span>
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(payment.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Order Notes */}
            <NotesPanel 
              entityType={EntityType.ORDER}
              entityId={order.id}
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={t('payments.addPayment')}
      >
        <form onSubmit={handleAddPayment} className="space-y-4">
          <Input
            label={t('payments.amount')}
            type="number"
            step="0.01"
            min="0.01"
            max={remainingAmount}
            value={paymentFormData.amount}
            onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: parseFloat(e.target.value) })}
            required
            fullWidth
          />
          <Select
            label={t('payments.method')}
            value={paymentFormData.method}
            onChange={(e) => setPaymentFormData({ ...paymentFormData, method: e.target.value as PaymentMethod })}
            options={paymentMethodOptions}
            required
            fullWidth
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)} type="button">
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t('payments.addPayment')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDeliveryModal}
        onClose={() => { setShowDeliveryModal(false); setSelectedItemId(null); }}
        title={t('orders.deliverItems')}
      >
        <form onSubmit={handleDeliver} className="space-y-4">
          <Input
            label={t('orders.quantityToDeliver')}
            type="number"
            min="1"
            value={deliveryQuantity}
            onChange={(e) => setDeliveryQuantity(parseInt(e.target.value))}
            required
            fullWidth
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowDeliveryModal(false); setSelectedItemId(null); }} type="button">
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t('common.deliver')}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
};
