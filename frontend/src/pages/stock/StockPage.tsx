import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Table } from '@/components/common/Table';
import { Pagination } from '@/components/common/Pagination';
import { stockMovementsApi } from '@/api/stockMovements';
import { productsApi } from '@/api/products';
import { formatDate, getErrorMessage } from '@/utils/format';
import type { StockMovement, StockMovementCreate, Product } from '@/types/entities';
import { StockMovementType } from '@/types/enums';

export const StockPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productFilter, setProductFilter] = useState<number | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<StockMovementCreate>({
    product_id: 0,
    quantity: 0,
    type: StockMovementType.IN,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadMovements();
  }, [page, productFilter]);

  const loadProducts = async () => {
    try {
      const data = await productsApi.list({ page_size: 1000 });
      setProducts(data.items);
    } catch (err: any) {
      console.error('Failed to load products:', err);
    }
  };

  const loadMovements = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await stockMovementsApi.list({
        page,
        page_size: 20,
        product_id: productFilter || undefined,
      });
      setMovements(data.items);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load stock movements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await stockMovementsApi.create(formData);
      setShowModal(false);
      resetForm();
      loadMovements();
      loadProducts();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to create stock movement'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: products.length > 0 ? products[0].id : 0,
      quantity: 0,
      type: StockMovementType.IN,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getProductName = (productId: number) => {
    return products.find((p) => p.id === productId)?.name || `#${productId}`;
  };

  const getProductStock = (productId: number) => {
    return products.find((p) => p.id === productId)?.current_stock || 0;
  };

  const getTypeBadge = (type: StockMovementType) => {
    const variants: Record<StockMovementType, 'success' | 'warning' | 'info'> = {
      [StockMovementType.IN]: 'success',
      [StockMovementType.OUT]: 'warning',
      [StockMovementType.ADJUSTMENT]: 'info',
    };
    const labels: Record<StockMovementType, string> = {
      [StockMovementType.IN]: t('stock.typeStockIn'),
      [StockMovementType.OUT]: t('stock.typeStockOut'),
      [StockMovementType.ADJUSTMENT]: t('stock.typeAdjustment'),
    };
    return <Badge variant={variants[type]}>{labels[type]}</Badge>;
  };

  /**
   * Parse backend reason strings and return localized JSX with clickable order links.
   * Patterns: "Delivered for Order #X", "Canceled Order #X — stock returned"
   */
  const renderReason = (m: StockMovement) => {
    const reason = m.reason;
    if (!reason) {
      return <span className="text-gray-400 dark:text-gray-500">{t('stock.noReason')}</span>;
    }

    // "Delivered for Order #123"
    const deliverMatch = reason.match(/^Delivered for Order #(\d+)$/);
    if (deliverMatch) {
      const orderId = deliverMatch[1];
      return (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {t('stock.deliveredForOrder')}{' '}
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/orders/${orderId}`); }}
            className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
          >
            #{orderId}
          </button>
        </span>
      );
    }

    // "Canceled Order #123 — stock returned"
    const cancelMatch = reason.match(/^Canceled Order #(\d+)/);
    if (cancelMatch) {
      const orderId = cancelMatch[1];
      return (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {t('stock.canceledOrderReturn')}{' '}
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/orders/${orderId}`); }}
            className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
          >
            #{orderId}
          </button>
        </span>
      );
    }

    return <span className="text-sm text-gray-700 dark:text-gray-300">{reason}</span>;
  };

  const columns = [
    { key: 'id', header: 'ID', className: 'w-20' },
    { key: 'product', header: t('stock.product'), render: (m: StockMovement) => getProductName(m.product_id) },
    {
      key: 'quantity',
      header: t('stock.quantity'),
      render: (m: StockMovement) => (
        <span className={m.type === StockMovementType.IN ? 'text-green-600 dark:text-green-400 font-medium' : m.type === StockMovementType.OUT ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
          {m.type === StockMovementType.IN ? '+' : m.type === StockMovementType.OUT ? '-' : ''}
          {m.quantity}
        </span>
      ),
    },
    { key: 'type', header: t('stock.type'), render: (m: StockMovement) => getTypeBadge(m.type) },
    {
      key: 'reason',
      header: t('stock.reason'),
      render: (m: StockMovement) => renderReason(m),
    },
    {
      key: 'performed_by',
      header: t('stock.performedBy'),
      render: (m: StockMovement) => (
        m.performed_by_username ? (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">{m.performed_by_username}</span>
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">-</span>
        )
      ),
    },
    {
      key: 'current_stock',
      header: t('products.currentStock'),
      render: (m: StockMovement) => getProductStock(m.product_id),
    },
    { key: 'created_at', header: t('stock.date'), render: (m: StockMovement) => formatDate(m.created_at) },
  ];

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.name} (${t('products.stock')}: ${p.current_stock})` }));

  const typeOptions = [
    { value: StockMovementType.IN, label: t('stock.typeStockIn') },
    { value: StockMovementType.OUT, label: t('stock.typeStockOut') },
    { value: StockMovementType.ADJUSTMENT, label: t('stock.typeAdjustment') },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('stock.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('stock.subtitle')}</p>
          </div>
          <Button onClick={openCreateModal}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('stock.addMovement')}
          </Button>
        </div>

        <Card>
          <div className="mb-4">
            <Select
              value={productFilter}
              onChange={(e) => {
                setProductFilter(e.target.value ? parseInt(e.target.value) : '');
                setPage(1);
              }}
              options={productOptions}
              placeholder={t('common.allProducts')}
              fullWidth
            />
            {productFilter && (
              <div className="mt-2">
                <Button variant="secondary" size="sm" onClick={() => { setProductFilter(''); setPage(1); }}>
                  {t('common.clearFilters')}
                </Button>
              </div>
            )}
          </div>

          {error && <ErrorMessage message={error} onRetry={loadMovements} />}

          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <Table columns={columns} data={movements} />
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </Card>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('stock.addMovement')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label={t('stock.product')}
            value={formData.product_id}
            onChange={(e) => setFormData({ ...formData, product_id: parseInt(e.target.value) })}
            options={productOptions}
            required
            fullWidth
          />
          <Select
            label={t('stock.type')}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as StockMovementType })}
            options={typeOptions}
            required
            fullWidth
          />
          <Input
            label={t('stock.quantity')}
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
            required
            fullWidth
          />
          <Input
            label={t('stock.reason')}
            value={formData.reason || ''}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder={t('stock.noReason')}
            fullWidth
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)} type="button">
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t('stock.addMovement')}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
};
