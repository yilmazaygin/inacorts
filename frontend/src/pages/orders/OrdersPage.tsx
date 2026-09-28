import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/layout/BackButton';
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
import { RecordFilters, emptyRecordFilters } from '@/components/common/RecordFilters';
import { LookupList, type LookupItem } from '@/components/common/LookupList';
import { ordersApi } from '@/api/orders';
import { customersApi } from '@/api/customers';
import { productsApi } from '@/api/products';
import { categoriesApi } from '@/api/categories';
import { formatCurrency, formatDate, getErrorMessage } from '@/utils/format';
import type { Order, OrderCreate, OrderItemCreate, Category } from '@/types/entities';
import { OrderStatus, PaymentStatus, DeliveryStatus } from '@/types/enums';

export const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryTotalPages, setCategoryTotalPages] = useState(1);
  const [customerQuery, setCustomerQuery] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [productCategoryId, setProductCategoryId] = useState<number | ''>('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [selectedProductName, setSelectedProductName] = useState('');
  const [itemNames, setItemNames] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [recordFilters, setRecordFilters] = useState(emptyRecordFilters());
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
    if (!showCreateModal) return;
    categoriesApi.list({ page: 1, page_size: 100, sort: 'name', order: 'asc' })
      .then((data) => {
        setCategories(data.items);
        setCategoryPage(1);
        setCategoryTotalPages(data.total_pages);
      })
      .catch(() => setCategories([]));
  }, [showCreateModal]);

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, paymentFilter, deliveryFilter, recordFilters]);

  useEffect(() => {
    if (searchParams.get('yeni') !== '1') return;
    resetForm();
    setShowCreateModal(true);
    const next = new URLSearchParams(searchParams);
    next.delete('yeni');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const loadMoreCategories = async () => {
    const next = categoryPage + 1;
    const data = await categoriesApi.list({ page: next, page_size: 100, sort: 'name', order: 'asc' });
    setCategories((current) => {
      const seen = new Set(current.map((category) => category.id));
      return [...current, ...data.items.filter((category) => !seen.has(category.id))];
    });
    setCategoryPage(data.page);
    setCategoryTotalPages(data.total_pages);
  };

  const fetchCustomers = useCallback(async (query: string, pageNumber: number) => {
    const data = await customersApi.list({ page: pageNumber, page_size: 20, search: query || undefined });
    return {
      ...data,
      items: data.items.map((customer): LookupItem => ({
        id: customer.id,
        label: customer.name,
        detail: customer.phone || customer.email || undefined,
      })),
    };
  }, []);

  const fetchProducts = useCallback(async (query: string, pageNumber: number) => {
    const data = await productsApi.list({
      page: pageNumber,
      page_size: 20,
      search: query || undefined,
      category_id: productCategoryId || undefined,
      sort: 'name',
      order: 'asc',
    });
    return {
      ...data,
      items: data.items.map((product): LookupItem => ({
        id: product.id,
        label: product.name,
        detail: formatCurrency(product.list_price),
      })),
    };
  }, [productCategoryId]);

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
        start_date: recordFilters.startDate || undefined,
        end_date: recordFilters.endDate || undefined,
        created_by: recordFilters.createdBy ? Number(recordFilters.createdBy) : undefined,
        tag_id: recordFilters.tagId ? Number(recordFilters.tagId) : undefined,
      });
      setOrders(data.items);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.product_id || newItem.quantity <= 0 || newItem.unit_price <= 0) {
      alert(t('common.fillAllFields'));
      return;
    }

    setItemNames((current) => ({ ...current, [newItem.product_id]: selectedProductName }));
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
    
    if (!formData.customer_id) {
      alert(t('orders.selectCustomer'));
      return;
    }

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
      navigate(`/admin/orders/${createdOrder.id}`);
    } catch (err: any) {
      alert(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ customer_id: 0, items: [] });
    setNewItem({ product_id: 0, quantity: 1, unit_price: 0 });
    setCustomerQuery('');
    setProductQuery('');
    setProductCategoryId('');
    setSelectedCustomerName('');
    setSelectedProductName('');
    setItemNames({});
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

  const getProductName = (productId: number) => itemNames[productId] || `#${productId}`;

  const handleProductSelect = async (item: LookupItem) => {
    setSelectedProductName(item.label);
    const product = await productsApi.get(item.id);
    setNewItem({ ...newItem, product_id: item.id, unit_price: product.list_price });
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const columns = [
    { key: 'id', header: t('orders.orderNumber'), className: 'w-24' },
    { key: 'customer', header: t('orders.customer'), render: (o: Order) => o.customer_name || `#${o.customer_id}` },
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

  const categoryOptions = [
    { value: '', label: t('products.allCategories') },
    ...categories.map((category) => ({ value: category.id, label: category.name })),
  ];

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
          <div className="flex items-center gap-1">
            <BackButton />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('orders.title')}</h1>
          </div>
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

          <div className="mb-4">
            <RecordFilters
              value={recordFilters}
              onChange={(next) => { setRecordFilters(next); setPage(1); }}
            />
          </div>

          {(statusFilter || paymentFilter || deliveryFilter || recordFilters.createdBy || recordFilters.tagId || recordFilters.startDate || recordFilters.endDate) && (
            <div className="mb-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStatusFilter('');
                  setPaymentFilter('');
                  setDeliveryFilter('');
                  setRecordFilters(emptyRecordFilters());
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
                onRowClick={(order) => navigate(`/admin/orders/${order.id}`)}
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
        size="xl"
      >
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('orders.customer')} <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <Input
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder={t('customers.searchPlaceholder')}
                fullWidth
                autoComplete="off"
              />
              <LookupList
                query={customerQuery}
                selectedId={formData.customer_id}
                onSelect={(customer) => {
                  setSelectedCustomerName(customer.label);
                  setFormData({ ...formData, customer_id: customer.id });
                }}
                fetchPage={fetchCustomers}
                emptyLabel={t('orders.noMatches')}
                loadMoreLabel={t('common.loadMore')}
              />
              {selectedCustomerName && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('orders.selected')}: <span className="font-medium text-gray-900 dark:text-gray-100">{selectedCustomerName}</span>
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">{t('orders.orderItems')}</h3>
            
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Select
                    label={t('products.category')}
                    value={productCategoryId}
                    onChange={(e) => setProductCategoryId(e.target.value ? parseInt(e.target.value) : '')}
                    options={categoryOptions}
                    fullWidth
                  />
                  {categoryPage < categoryTotalPages && (
                    <button type="button" className="mt-1 text-sm text-primary-700 dark:text-primary-300" onClick={loadMoreCategories}>
                      {t('common.loadMore')}
                    </button>
                  )}
                </div>
                <Input
                  label={t('common.search')}
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder={t('products.searchPlaceholder')}
                  fullWidth
                  autoComplete="off"
                />
              </div>
              <div>
                <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('common.product')} <span className="text-red-500">*</span>
                </p>
                <LookupList
                  query={productQuery}
                  selectedId={newItem.product_id}
                  onSelect={handleProductSelect}
                  fetchPage={fetchProducts}
                  emptyLabel={t('orders.noMatches')}
                  loadMoreLabel={t('common.loadMore')}
                  reloadKey={productCategoryId}
                />
              </div>
              {selectedProductName && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('orders.selected')}: <span className="font-medium text-gray-900 dark:text-gray-100">{selectedProductName}</span>
                  {' · '}
                  {formatCurrency(newItem.unit_price)}
                </p>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="grid flex-1 grid-cols-2 gap-3">
                  <Input
                    label={t('common.quantity')}
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                    required
                    fullWidth
                  />
                  <Input
                    label={t('common.unitPrice')}
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) })}
                    required
                    fullWidth
                  />
                </div>
                <Button type="button" onClick={handleAddItem} variant="secondary">
                  {t('common.addItem')}
                </Button>
              </div>
            </div>

            {formData.items.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {formData.items.map((item, index) => {
                    const lineTotal = item.quantity * item.unit_price;
                    const name = getProductName(item.product_id);
                    return (
                      <li key={index} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100" title={name}>
                            {name}
                          </p>
                          <p className="mt-0.5 text-xs tabular-nums text-gray-500 dark:text-gray-400">
                            {item.quantity} × {formatCurrency(item.unit_price)}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">
                          {formatCurrency(lineTotal)}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          aria-label={t('common.remove')}
                          className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-700/60">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('common.total')}</span>
                  <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">{formatCurrency(totalAmount)}</span>
                </div>
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
