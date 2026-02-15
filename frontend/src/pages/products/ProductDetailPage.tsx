import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { TextArea } from '@/components/common/TextArea';
import { Select } from '@/components/common/Select';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Badge } from '@/components/common/Badge';
import { NotesPanel } from '@/components/common/NotesPanel';
import { productsApi } from '@/api/products';
import { categoriesApi } from '@/api/categories';
import { stockMovementsApi } from '@/api/stockMovements';
import { formatCurrency, formatDate, getErrorMessage } from '@/utils/format';
import type { Product, ProductUpdate, Category, StockMovement } from '@/types/entities';
import { EntityType, StockMovementType } from '@/types/enums';

export const ProductDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProductUpdate>({});

  useEffect(() => {
    if (id) {
      loadProductData();
    }
  }, [id]);

  const loadProductData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const productId = parseInt(id!);

      const [productData, categoriesData, movementsData] = await Promise.all([
        productsApi.get(productId),
        categoriesApi.list({ page_size: 1000 }),
        stockMovementsApi.list({ product_id: productId, page_size: 50 }),
      ]);

      setProduct(productData);
      setCategories(categoriesData.items);
      setStockMovements(movementsData.items);
      setFormData({
        name: productData.name,
        description: productData.description,
        barcode: productData.barcode,
        category_id: productData.category_id,
        list_price: productData.list_price,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load product data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    try {
      setIsSaving(true);
      await productsApi.update(product.id, formData);
      setIsEditing(false);
      await loadProductData();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to update product'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('common.confirmDelete'))) return;
    try {
      await productsApi.delete(product!.id);
      navigate('/products');
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to delete product'));
    }
  };

  const getCategoryName = (categoryId: number) => {
    return categories.find((c) => c.id === categoryId)?.name || '-';
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="danger">{t('products.stockOutOfStock')}</Badge>;
    if (stock < 10) return <Badge variant="warning">{t('products.stockLowStock')}</Badge>;
    return <Badge variant="success">{t('products.stockInStock')}</Badge>;
  };

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case StockMovementType.IN:
        return <Badge variant="success">{t('stock.typeStockIn')}</Badge>;
      case StockMovementType.OUT:
        return <Badge variant="danger">{t('stock.typeStockOut')}</Badge>;
      case StockMovementType.ADJUSTMENT:
        return <Badge variant="warning">{t('stock.typeAdjustment')}</Badge>;
      default:
        return <Badge variant="default">{type}</Badge>;
    }
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

  if (error || !product) {
    return (
      <AppLayout>
        <ErrorMessage message={error || 'Product not found'} />
      </AppLayout>
    );
  }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/products')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                {getStockBadge(product.current_stock)}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('products.currentStock')}: {product.current_stock}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            {!isEditing && (
              <>
                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                  {t('common.edit')}
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  {t('common.delete')}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - product info & stock movements */}
          <div className="lg:col-span-2 space-y-6">
            <Card title={t('products.productDetails')}>
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <Input
                    label={t('products.name')}
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    fullWidth
                  />
                  <TextArea
                    label={t('products.description')}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    fullWidth
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={t('products.barcode')}
                      value={formData.barcode || ''}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      fullWidth
                    />
                    <Input
                      label={t('products.listPrice')}
                      type="number"
                      step="0.01"
                      value={formData.list_price || 0}
                      onChange={(e) => setFormData({ ...formData, list_price: parseFloat(e.target.value) })}
                      required
                      fullWidth
                    />
                  </div>
                  <Select
                    label={t('products.category')}
                    value={formData.category_id || 0}
                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
                    options={categoryOptions}
                    required
                    fullWidth
                  />
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: product.name,
                          description: product.description,
                          barcode: product.barcode,
                          category_id: product.category_id,
                          list_price: product.list_price,
                        });
                      }}
                      type="button"
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" loading={isSaving}>
                      {t('common.saveChanges')}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('products.category')}</label>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{getCategoryName(product.category_id)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('products.listPrice')}</label>
                      <p className="text-gray-900 dark:text-gray-100 font-bold text-lg">{formatCurrency(product.list_price)}</p>
                    </div>
                  </div>
                  {product.barcode && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('products.barcode')}</label>
                      <p className="text-gray-900 dark:text-gray-100">{product.barcode}</p>
                    </div>
                  )}
                  {product.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('products.description')}</label>
                      <p className="text-gray-900 dark:text-gray-100">{product.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('products.currentStock')}</label>
                      <div className="flex items-center space-x-2">
                        <p className="text-gray-900 dark:text-gray-100 font-medium">{product.current_stock}</p>
                        {getStockBadge(product.current_stock)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('common.createdAt')}</label>
                      <p className="text-gray-900 dark:text-gray-100">{formatDate(product.created_at)}</p>
                    </div>
                  </div>
                  {product.created_by_username && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('products.createdBy')}</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{product.created_by_username}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Stock Movements */}
            <Card title={t('stock.title')}>
              {stockMovements.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                  {t('common.noData')}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">{t('stock.date')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">{t('stock.type')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">{t('stock.quantity')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">{t('stock.reason')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">{t('stock.performedBy')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {stockMovements.map((movement) => (
                        <tr key={movement.id}>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">
                            {formatDate(movement.created_at)}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {getMovementTypeBadge(movement.type)}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                            {movement.type === StockMovementType.IN ? '+' : movement.type === StockMovementType.OUT ? '-' : ''}{movement.quantity}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">
                            {movement.reason || t('stock.noReason')}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200">
                            {movement.performed_by_username || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Right column - Notes */}
          <div className="space-y-6">
            <NotesPanel
              entityType={EntityType.PRODUCT}
              entityId={product.id}
              title={t('products.productNotes')}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
