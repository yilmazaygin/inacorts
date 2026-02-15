import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Table } from '@/components/common/Table';
import { Pagination } from '@/components/common/Pagination';
import { Badge } from '@/components/common/Badge';
import { ordersApi } from '@/api/orders';
import { customersApi } from '@/api/customers';
import { productsApi } from '@/api/products';
import { formatCurrency, formatDate, getErrorMessage } from '@/utils/format';
import type { Order, OrderCreate, OrderItemCreate, Customer, Product } from '@/types/entities';
import { OrderStatus, PaymentStatus, DeliveryStatus } from '@/types/enums';

export const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | ''>('');
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryStatus | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<OrderCreate>({
    customer_id: 0,
    items: [],
  });

  const [newItem, setNewItem] = useState<OrderItemCreate>({
    product_id: 0,
    quantity: 1,
    unit_price: 0,
  });

  useEffect(() => {
    loadCustomersAndProducts();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, paymentFilter, deliveryFilter]);

  const loadCustomersAndProducts = async () => {
    try {
      const [customersData, productsData] = await Promise.all([
        customersApi.list({ page_size: 1000 }),
        productsApi.list({ page_size: 1000 }),
      ]);
      setCustomers(customersData.items);
      setProducts(productsData.items);
    } catch (err: any) {
      console.error('Failed to load customers/products:', err);
    }
  };

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await ordersApi.list({
        page,
        page_size: 20,
        order_status: statusFilter || undefined,
        payment_status: paymentFilter || undefined,
        delivery_status: deliveryFilter || undefined,
      });
      setOrders(data.items);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.product_id || newItem.quantity <= 0 || newItem.unit_price <= 0) {
      alert(t('common.fillAllFields'));
      return;
    }

    setFormData({
      ...formData,
      items: [...formData.items, { ...newItem }],
    });

    setNewItem({ product_id: 0, quantity: 1, unit_price: 0 });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      alert(t('common.addAtLeastOneItem'));
      return;
    }

    try {
      setIsSubmitting(true);
      const createdOrder = await ordersApi.create(formData);
      setShowCreateModal(false);
      resetForm();
      // Navigate directly to the newly created order
      navigate(`/orders/${createdOrder.id}`);
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to create order'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ customer_id: customers.length > 0 ? customers[0].id : 0, items: [] });
    setNewItem({ product_id: 0, quantity: 1, unit_price: 0 });
  };

  const getStatusBadge = (status: OrderStatus) => {
    const variants: Record<OrderStatus, 'success' | 'warning' | 'danger' | 'default'> = {
      [OrderStatus.COMPLETED]: 'success',
      [OrderStatus.OPEN]: 'default',
      [OrderStatus.CANCELED]: 'danger',
    };
    const labels: Record<OrderStatus, string> = {
      [OrderStatus.COMPLETED]: t('orders.statusCompleted'),
      [OrderStatus.OPEN]: t('orders.statusOpen'),
      [OrderStatus.CANCELED]: t('orders.statusCanceled'),
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, 'success' | 'warning' | 'danger'> = {
      [PaymentStatus.PAID]: 'success',
      [PaymentStatus.PARTIALLY_PAID]: 'warning',
      [PaymentStatus.UNPAID]: 'danger',
    };
    const labels: Record<PaymentStatus, string> = {
      [PaymentStatus.PAID]: t('orders.paymentStatusPaid'),
      [PaymentStatus.PARTIALLY_PAID]: t('orders.paymentStatusPartial'),
      [PaymentStatus.UNPAID]: t('orders.paymentStatusUnpaid'),
    };
    return <Badge variant={variants[status]} size="sm">{labels[status]}</Badge>;
  };

  const getDeliveryBadge = (status: DeliveryStatus) => {
    const variants: Record<DeliveryStatus, 'success' | 'warning' | 'info'> = {
      [DeliveryStatus.DELIVERED]: 'success',
      [DeliveryStatus.PARTIALLY_DELIVERED]: 'warning',
      [DeliveryStatus.NOT_DELIVERED]: 'info',
    };
    const labels: Record<DeliveryStatus, string> = {
      [DeliveryStatus.DELIVERED]: t('orders.deliveryStatusDelivered'),
      [DeliveryStatus.PARTIALLY_DELIVERED]: t('orders.deliveryStatusPartial'),
      [DeliveryStatus.NOT_DELIVERED]: t('orders.deliveryStatusPending'),
    };
    return <Badge variant={variants[status]} size="sm">{labels[status]}</Badge>;
  };

  const getCustomerName = (customerId: number) => {
    return customers.find((c) => c.id === customerId)?.name || `#${customerId}`;
  };

  const getProductName = (productId: number) => {
    return products.find((p) => p.id === productId)?.name || `#${productId}`;
  };

  const getProductPrice = (productId: number) => {
    return products.find((p) => p.id === productId)?.list_price || 0;
  };

  const handleProductSelect = (productId: number) => {
    const price = getProductPrice(productId);
    setNewItem({ ...newItem, product_id: productId, unit_price: price });
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const columns = [
    { key: 'id', header: t('orders.orderNumber'), className: 'w-24' },
    { key: 'customer', header: t('orders.customer'), render: (o: Order) => getCustomerName(o.customer_id) },
    { key: 'items', header: t('orders.items'), render: (o: Order) => t('orders.itemCount', { count: o.items.length }) },
    { key: 'total_amount', header: t('orders.total'), render: (o: Order) => formatCurrency(o.total_amount) },
    { key: 'status', header: t('orders.status'), render: (o: Order) => getStatusBadge(o.order_status) },
    {
      key: 'payment_delivery',
      header: t('orders.paymentDelivery'),
      render: (o: Order) => (
        <div className="flex flex-col space-y-1">
          {getPaymentBadge(o.payment_status)}
          {getDeliveryBadge(o.delivery_status)}
        </div>
      ),
    },
    { key: 'created_at', header: t('orders.date'), render: (o: Order) => formatDate(o.created_at) },
  ];

  const customerOptions = customers.map((c) => ({ value: c.id, label: c.name }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.name} - ${formatCurrency(p.list_price)}` }));

  const statusOptions = [
    { value: OrderStatus.OPEN, label: t('orders.statusOpen') },
    { value: OrderStatus.COMPLETED, label: t('orders.statusCompleted') },
    { value: OrderStatus.CANCELED, label: t('orders.statusCanceled') },
  ];

  const paymentOptions = [
    { value: PaymentStatus.UNPAID, label: t('orders.paymentStatusUnpaid') },
    { value: PaymentStatus.PARTIALLY_PAID, label: t('orders.paymentStatusPartial') },
    { value: PaymentStatus.PAID, label: t('orders.paymentStatusPaid') },
  ];

  const deliveryOptions = [
    { value: DeliveryStatus.NOT_DELIVERED, label: t('orders.deliveryStatusPending') },
    { value: DeliveryStatus.PARTIALLY_DELIVERED, label: t('orders.deliveryStatusPartial') },
    { value: DeliveryStatus.DELIVERED, label: t('orders.deliveryStatusDelivered') },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('orders.title')}</h1>
          <Button onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('orders.createOrder')}
          </Button>
        </div>

        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | ''); setPage(1); }}
              options={statusOptions}
              placeholder={t('orders.allStatuses')}
              fullWidth
            />
            <Select
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value as PaymentStatus | ''); setPage(1); }}
              options={paymentOptions}
              placeholder={t('orders.allPaymentStatuses')}
              fullWidth
            />
            <Select
              value={deliveryFilter}
              onChange={(e) => { setDeliveryFilter(e.target.value as DeliveryStatus | ''); setPage(1); }}
              options={deliveryOptions}
              placeholder={t('orders.allDeliveryStatuses')}
              fullWidth
            />
          </div>

          {(statusFilter || paymentFilter || deliveryFilter) && (
            <div className="mb-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStatusFilter('');
                  setPaymentFilter('');
                  setDeliveryFilter('');
                  setPage(1);
                }}
              >
                {t('common.clearFilters')}
              </Button>
            </div>
          )}

          {error && <ErrorMessage message={error} onRetry={loadOrders} />}

          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={orders}
                onRowClick={(order) => navigate(`/orders/${order.id}`)}
              />
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('orders.createOrder')}
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-6">
          <Select
            label={t('orders.customer')}
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: parseInt(e.target.value) })}
            options={customerOptions}
            required
            fullWidth
          />

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">{t('orders.orderItems')}</h3>
            
            <div className="space-y-3 mb-4">
              <Select
                label={t('common.product')}
                value={newItem.product_id}
                onChange={(e) => handleProductSelect(parseInt(e.target.value))}
                options={productOptions}
                placeholder={t('common.selectProduct')}
                fullWidth
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={t('common.quantity')}
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                  fullWidth
                />
                <Input
                  label={t('common.unitPrice')}
                  type="number"
                  step="0.01"
                  min="0"
                  value={newItem.unit_price}
                  onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) })}
                  fullWidth
                />
              </div>
              <Button type="button" onClick={handleAddItem} variant="secondary" size="sm">
                {t('common.addItem')}
              </Button>
            </div>

            {formData.items.length > 0 ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">{t('common.product')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">{t('common.quantity')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">{t('common.price')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">{t('common.total')}</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">{getProductName(item.product_id)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-200">{formatCurrency(item.quantity * item.unit_price)}</td>
                        <td className="px-4 py-2 text-sm">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            {t('common.remove')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-sm font-medium text-right text-gray-900 dark:text-gray-200">{t('common.total')}:</td>
                      <td className="px-4 py-2 text-sm font-bold text-gray-900 dark:text-gray-200">{formatCurrency(totalAmount)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8 border border-gray-200 dark:border-gray-700 rounded-lg">
                {t('common.noItemsAdded')}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)} type="button">
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t('orders.createOrder')}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
};
