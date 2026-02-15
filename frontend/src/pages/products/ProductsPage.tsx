import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { TextArea } from '@/components/common/TextArea';
import { Modal } from '@/components/common/Modal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Table } from '@/components/common/Table';
import { Pagination } from '@/components/common/Pagination';
import { Badge } from '@/components/common/Badge';
import { DropdownMenu } from '@/components/common/DropdownMenu';
import {NotesPanel } from '@/components/common/NotesPanel';
import { productsApi } from '@/api/products';
import { categoriesApi } from '@/api/categories';
import { formatCurrency, getErrorMessage } from '@/utils/format';
import type { Product, ProductCreate, Category } from '@/types/entities';
import { EntityType } from '@/types/enums';

export const ProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryName, setCategoryName] = useState('');

  const [formData, setFormData] = useState<ProductCreate>({
    name: '',
    description: '',
    barcode: '',
    category_id: 0,
    list_price: 0,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, search, categoryFilter]);

  const loadCategories = async () => {
    try {
      const data = await categoriesApi.list({ page_size: 1000 });
      setCategories(data.items);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await productsApi.list({
        page,
        page_size: 20,
        search: search || undefined,
        category_id: categoryFilter || undefined,
      });
      setProducts(data.items);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await productsApi.create(formData);
      setShowCreateModal(false);
      resetForm();
      loadProducts();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to create product'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setIsSubmitting(true);
      await productsApi.update(selectedProduct.id, formData);
      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
      loadProducts();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to update product'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('common.confirmDelete'))) return;

    try {
      await productsApi.delete(id);
      loadProducts();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to delete product'));
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      barcode: product.barcode,
      category_id: product.category_id,
      list_price: product.list_price,
    });
    setShowEditModal(true);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    try {
      setIsSubmitting(true);
      await categoriesApi.create({ name: categoryName.trim() });
      setCategoryName('');
      await loadCategories();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to create category'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm(t('products.confirmDeleteCategory'))) return;
    try {
      await categoriesApi.delete(categoryId);
      await loadCategories();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to delete category'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      barcode: '',
      category_id: categories.length > 0 ? categories[0].id : 0,
      list_price: 0,
    });
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="danger">{t('products.stockOutOfStock')}</Badge>;
    if (stock < 10) return <Badge variant="warning">{t('products.stockLowStock')}</Badge>;
    return <Badge variant="success">{t('products.stockInStock')}</Badge>;
  };

  const getCategoryName = (categoryId: number) => {
    return categories.find((c) => c.id === categoryId)?.name || '-';
  };

  const columns = [
    { key: 'id', header: t('common.id'), className: 'w-20' },
    { key: 'name', header: t('products.name') },
    { key: 'category', header: t('products.category'), render: (p: Product) => getCategoryName(p.category_id) },
    { key: 'barcode', header: t('products.barcode'), render: (p: Product) => p.barcode || '-' },
    { key: 'list_price', header: t('products.listPrice'), render: (p: Product) => formatCurrency(p.list_price) },
    {
      key: 'current_stock',
      header: t('products.stock'),
      render: (p: Product) => (
        <span className="font-medium">{p.current_stock}</span>
      ),
    },
    {
      key: 'stock_status',
      header: t('products.stockStatus'),
      render: (p: Product) => getStockBadge(p.current_stock),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (p: Product) => (
        <DropdownMenu
          items={[
            {
              label: t('common.showNotes'),
              onClick: () => {
                setSelectedProduct(p);
                setShowNotesModal(true);
              },
            },
            {
              label: t('common.edit'),
              onClick: () => openEditModal(p),
            },
            {
              label: t('common.delete'),
              onClick: () => handleDelete(p.id),
              variant: 'danger',
            },
          ]}
        />
      ),
    },
  ];

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('products.title')}</h1>
            {!isLoading && products.length > 0 && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('products.totalProducts', { count: products.length })}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowCategoryModal(true)}>
              {t('products.manageCategories')}
            </Button>
            <Button onClick={() => { resetForm(); setShowCreateModal(true); }}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('products.addProduct')}
            </Button>
          </div>
        </div>

        <Card>
          <div className="space-y-4 mb-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('products.searchPlaceholder')}
                fullWidth
              />
              <Button type="submit">{t('common.search')}</Button>
            </form>

            <div className="flex gap-2">
              <Select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value ? parseInt(e.target.value) : '');
                  setPage(1);
                }}
                options={categoryOptions}
                placeholder={t('products.allCategories')}
                fullWidth
              />
              {(search || categoryFilter) && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setSearchInput('');
                    setCategoryFilter('');
                    setPage(1);
                  }}
                >
                  {t('common.clearFilters')}
                </Button>
              )}
            </div>
          </div>

          {error && <ErrorMessage message={error} onRetry={loadProducts} />}

          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <Table columns={columns} data={products} onRowClick={(p) => navigate(`/products/${p.id}`)} />
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('products.addProduct')}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label={t('products.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />
          <TextArea
            label={t('products.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('products.barcode')}
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              fullWidth
            />
            <Input
              label={t('products.listPrice')}
              type="number"
              step="0.01"
              value={formData.list_price}
              onChange={(e) => setFormData({ ...formData, list_price: parseFloat(e.target.value) })}
              required
              fullWidth
            />
          </div>
          <Select
            label={t('products.category')}
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
            options={categoryOptions}
            required
            fullWidth
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)} type="button">
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedProduct(null); }}
        title={t('products.editProduct')}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label={t('products.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />
          <TextArea
            label={t('products.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('products.barcode')}
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              fullWidth
            />
            <Input
              label={t('products.listPrice')}
              type="number"
              step="0.01"
              value={formData.list_price}
              onChange={(e) => setFormData({ ...formData, list_price: parseFloat(e.target.value) })}
              required
              fullWidth
            />
          </div>
          <Select
            label={t('products.category')}
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
            options={categoryOptions}
            required
            fullWidth
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setSelectedProduct(null); }} type="button">
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t('common.saveChanges')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Notes Modal */}
      <Modal
        isOpen={showNotesModal}
        onClose={() => { setShowNotesModal(false); setSelectedProduct(null); }}
        title={`${t('products.productNotes')}: ${selectedProduct?.name || ''}`}
      >
        {selectedProduct && (
          <NotesPanel 
            entityType={EntityType.PRODUCT}
            entityId={selectedProduct.id}
          />
        )}
      </Modal>

      {/* Category Management Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title={t('products.manageCategories')}
      >
        <div className="space-y-4">
          <form onSubmit={handleCreateCategory} className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t('products.addCategory')}
            </h3>
            <Input
              label={t('products.categoryName')}
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
            <Button type="submit" disabled={isSubmitting} fullWidth>
              {isSubmitting ? t('common.loading') : t('products.addCategory')}
            </Button>
          </form>

          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              {t('products.existingCategories')}
            </h3>
            {categories.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('products.noCategories')}
              </p>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </p>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
};
