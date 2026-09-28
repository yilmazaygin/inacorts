import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/layout/BackButton';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { TextArea } from '@/components/common/TextArea';
import { Modal } from '@/components/common/Modal';
import { Drawer } from '@/components/common/Drawer';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Table } from '@/components/common/Table';
import { Pagination } from '@/components/common/Pagination';
import { Badge } from '@/components/common/Badge';
import { DropdownMenu } from '@/components/common/DropdownMenu';
import {NotesPanel } from '@/components/common/NotesPanel';
import { ProductImage, ProductImageField } from '@/components/common/ProductImage';
import { RecordFilters, emptyRecordFilters } from '@/components/common/RecordFilters';
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
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryTotalPages, setCategoryTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [recordFilters, setRecordFilters] = useState(emptyRecordFilters());
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkMode, setBulkMode] = useState<'percent' | 'amount'>('percent');
  const [bulkValue, setBulkValue] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [showAddCategoryDrawer, setShowAddCategoryDrawer] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null);
  const [categoryImageError, setCategoryImageError] = useState('');
  const [categoryPhotoId, setCategoryPhotoId] = useState<number | null>(null);

  const [formData, setFormData] = useState<ProductCreate>({
    name: '',
    sku: '',
    description: '',
    category_id: 0,
    list_price: 0,
    show_on_site: true,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, search, categoryFilter, recordFilters]);

  const loadCategories = async (pageNumber = 1, append = false) => {
    try {
      const data = await categoriesApi.list({ page: pageNumber, page_size: 100, sort: 'name', order: 'asc' });
      setCategories((current) => {
        if (!append) return data.items;
        const seen = new Set(current.map((category) => category.id));
        return [...current, ...data.items.filter((category) => !seen.has(category.id))];
      });
      setCategoryPage(data.page);
      setCategoryTotalPages(data.total_pages);
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
        created_by: recordFilters.createdBy ? Number(recordFilters.createdBy) : undefined,
        start_date: recordFilters.startDate || undefined,
        end_date: recordFilters.endDate || undefined,
        tag_id: recordFilters.tagId ? Number(recordFilters.tagId) : undefined,
      });
      setProducts(data.items);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('errors.loadFailed'));
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
      const created = await productsApi.create(formData);
      if (imageFiles.length > 0) {
        await productsApi.saveImages(created.id, imageFiles, []);
      }
      setShowCreateModal(false);
      resetForm();
      loadProducts();
    } catch (err: any) {
      alert(getErrorMessage(err, t('errors.saveFailed')));
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
      if (imageFiles.length > 0 || removedImageUrls.length > 0) {
        await productsApi.saveImages(selectedProduct.id, imageFiles, removedImageUrls);
      }
      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
      loadProducts();
    } catch (err: any) {
      alert(getErrorMessage(err, t('errors.saveFailed')));
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
      alert(getErrorMessage(err, t('errors.deleteFailed')));
    }
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      description: product.description,
      category_id: product.category_id,
      list_price: product.list_price,
      show_on_site: product.show_on_site,
    });
    setImageFiles([]);
    setRemovedImageUrls([]);
    setShowEditModal(true);
  };

  useEffect(() => {
    if (!categoryImage) {
      setCategoryImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(categoryImage);
    setCategoryImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [categoryImage]);

  const selectCategoryImage = (file: File | null) => {
    setCategoryImageError('');
    if (!file) {
      setCategoryImage(null);
      return;
    }
    const typeOk = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
      || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
    if (!typeOk) {
      setCategoryImageError(t('products.imageInvalidType'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCategoryImageError(t('products.imageTooLarge'));
      return;
    }
    setCategoryImage(file);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    try {
      setIsSubmitting(true);
      const created = await categoriesApi.create({ name: categoryName.trim() });
      if (categoryImage) {
        try {
          await categoriesApi.uploadImage(created.id, categoryImage);
        } catch (err: any) {
          alert(getErrorMessage(err, t('errors.saveFailed')));
        }
      }
      setCategoryName('');
      setCategoryImage(null);
      setCategoryImageError('');
      setShowAddCategoryDrawer(false);
      await loadCategories();
    } catch (err: any) {
      alert(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeCategoryImage = async (categoryId: number, file: File | null) => {
    setCategoryPhotoId(categoryId);
    try {
      if (file) await categoriesApi.uploadImage(categoryId, file);
      else await categoriesApi.deleteImage(categoryId);
      await loadCategories();
    } catch (err: any) {
      alert(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setCategoryPhotoId(null);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm(t('products.confirmDeleteCategory'))) return;
    try {
      await categoriesApi.delete(categoryId);
      await loadCategories();
    } catch (err: any) {
      alert(getErrorMessage(err, t('errors.deleteFailed')));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      category_id: categories.length > 0 ? categories[0].id : 0,
      list_price: 0,
      show_on_site: true,
    });
    setImageFiles([]);
    setRemovedImageUrls([]);
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="danger">{t('products.stockOutOfStock')}</Badge>;
    if (stock < 10) return <Badge variant="warning">{t('products.stockLowStock')}</Badge>;
    return <Badge variant="success">{t('products.stockInStock')}</Badge>;
  };

  const getCategoryName = (categoryId: number) => {
    return categories.find((c) => c.id === categoryId)?.name || '-';
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleSite = async (product: Product) => {
    try {
      const updated = await productsApi.update(product.id, { show_on_site: !product.show_on_site });
      setProducts((current) => current.map((item) => (item.id === product.id ? updated : item)));
    } catch (err) {
      alert(getErrorMessage(err, t('errors.saveFailed')));
    }
  };

  const handleBulkPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(bulkValue);
    if (!selectedIds.length || Number.isNaN(value)) {
      alert(t('products.selectProducts'));
      return;
    }
    try {
      setIsSubmitting(true);
      const result = await productsApi.bulkPrice(selectedIds, bulkMode, value);
      setShowBulk(false);
      setBulkValue('');
      setSelectedIds([]);
      alert(t('products.priceUpdated', { count: result.updated }));
      loadProducts();
    } catch (err) {
      alert(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageIds = products.map((product) => product.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const productExtras = (
    <>
      <Input
        label={t('products.sku')}
        value={formData.sku || ''}
        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
        fullWidth
      />
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={formData.show_on_site !== false}
          onChange={(e) => setFormData({ ...formData, show_on_site: e.target.checked })}
        />
        {t('products.showOnSite')}
      </label>
    </>
  );

  const columns = [
    {
      key: 'select',
      header: '',
      className: 'w-10',
      render: (p: Product) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(p.id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => toggleSelected(p.id)}
        />
      ),
    },
    { key: 'id', header: t('common.id'), className: 'w-20' },
    {
      key: 'image',
      header: t('products.image'),
      className: 'w-16',
      render: (p: Product) => <ProductImage src={p.image_url} alt={p.name} />,
    },
    { key: 'name', header: t('products.name') },
    { key: 'sku', header: t('products.sku'), render: (p: Product) => p.sku || '-' },
    { key: 'category', header: t('products.category'), render: (p: Product) => getCategoryName(p.category_id) },
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
      key: 'show_on_site',
      header: t('products.showOnSite'),
      render: (p: Product) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleSite(p); }}
          className={`rounded-full px-2 py-1 text-xs ${p.show_on_site ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
        >
          {p.show_on_site ? t('products.showOnSite') : t('products.hideOnSite')}
        </button>
      ),
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
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-1">
              <BackButton />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('products.title')}</h1>
            </div>
            {!isLoading && products.length > 0 && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('products.totalProducts', { count: products.length })}
              </p>
            )}
          </div>
          <div className="flex w-full gap-2">
            <Button className="min-w-0 flex-1" onClick={() => { resetForm(); setShowCreateModal(true); }}>
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('products.addProduct')}
            </Button>
            <button
              type="button"
              aria-label={t('products.manageCategories')}
              title={t('products.manageCategories')}
              onClick={() => setShowCategoryDrawer(true)}
              className="inline-flex w-10 shrink-0 items-center justify-center self-stretch rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
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
              {(search || categoryFilter || recordFilters.createdBy || recordFilters.startDate || recordFilters.endDate || recordFilters.tagId) && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('');
                    setSearchInput('');
                    setCategoryFilter('');
                    setRecordFilters(emptyRecordFilters());
                    setPage(1);
                  }}
                >
                  {t('common.clearFilters')}
                </Button>
              )}
            </div>
            <RecordFilters
              value={recordFilters}
              onChange={(next) => { setRecordFilters(next); setPage(1); }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedIds((current) => (
                    allPageSelected
                      ? current.filter((id) => !pageIds.includes(id))
                      : [...new Set([...current, ...pageIds])]
                  ));
                }}
              >
                {allPageSelected ? t('common.clear') : t('products.selectPage')}
              </Button>
              <Button type="button" size="sm" onClick={() => setShowBulk(true)} disabled={selectedIds.length === 0}>
                {t('products.bulkPrice')} ({selectedIds.length})
              </Button>
            </div>
          </div>

          {error && <ErrorMessage message={error} onRetry={loadProducts} />}

          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <Table columns={columns} data={products} onRowClick={(p) => navigate(`/admin/products/${p.id}`)} />
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
          <ProductImageField
            currentUrls={[]}
            files={imageFiles}
            removedUrls={removedImageUrls}
            onFilesChange={setImageFiles}
            onRemovedUrlsChange={setRemovedImageUrls}
            alt={formData.name}
          />
          <Input
            label={t('products.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />
          {productExtras}
          <TextArea
            label={t('products.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('products.listPrice')}
              type="number"
              step="0.01"
              value={formData.list_price}
              onChange={(e) => setFormData({ ...formData, list_price: parseFloat(e.target.value) })}
              required
              fullWidth
            />
            <Select
              label={t('products.category')}
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
              options={categoryOptions}
              required
              fullWidth
            />
          </div>
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
          <ProductImageField
            currentUrls={selectedProduct?.image_urls?.length ? selectedProduct.image_urls : (selectedProduct?.image_url ? [selectedProduct.image_url] : [])}
            files={imageFiles}
            removedUrls={removedImageUrls}
            onFilesChange={setImageFiles}
            onRemovedUrlsChange={setRemovedImageUrls}
            alt={formData.name}
          />
          <Input
            label={t('products.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />
          {productExtras}
          <TextArea
            label={t('products.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('products.listPrice')}
              type="number"
              step="0.01"
              value={formData.list_price}
              onChange={(e) => setFormData({ ...formData, list_price: parseFloat(e.target.value) })}
              required
              fullWidth
            />
            <Select
              label={t('products.category')}
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
              options={categoryOptions}
              required
              fullWidth
            />
          </div>
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

      <Drawer
        isOpen={showCategoryDrawer}
        onClose={() => {
          if (showAddCategoryDrawer) return;
          setShowCategoryDrawer(false);
        }}
        title={t('products.manageCategories')}
      >
        <div className="space-y-4">
          <Button
            fullWidth
            onClick={() => {
              setCategoryName('');
              setCategoryImage(null);
              setCategoryImageError('');
              setShowAddCategoryDrawer(true);
            }}
          >
            {t('products.addCategory')}
          </Button>

          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
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
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <ProductImage src={category.image_url} alt={category.name} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        <label className="cursor-pointer text-xs font-medium text-primary-600 dark:text-primary-400">
                          {categoryPhotoId === category.id ? t('common.loading') : t('products.uploadCategoryImage')}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="hidden"
                            disabled={categoryPhotoId === category.id}
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              event.target.value = '';
                              if (file) changeCategoryImage(category.id, file);
                            }}
                          />
                        </label>
                        {category.image_url && (
                          <button
                            type="button"
                            disabled={categoryPhotoId === category.id}
                            onClick={() => changeCategoryImage(category.id, null)}
                            className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50"
                          >
                            {t('products.removeCategoryImage')}
                          </button>
                        )}
                      </div>
                    </div>
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
            {categoryPage < categoryTotalPages && (
              <Button type="button" variant="secondary" fullWidth onClick={() => loadCategories(categoryPage + 1, true)}>
                {t('common.loadMore')}
              </Button>
            )}
          </div>
        </div>
      </Drawer>

      <Drawer
        isOpen={showAddCategoryDrawer}
        onClose={() => setShowAddCategoryDrawer(false)}
        title={t('products.addCategory')}
        className="z-[60]"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label={t('products.categoryName')}
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
            fullWidth
          />
          <div>
            <p className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('products.image')}
            </p>
            <div className="flex items-center gap-3">
              <ProductImage src={categoryImagePreview} alt={categoryName || t('products.image')} />
              <div className="space-y-1">
                <label className="cursor-pointer text-sm font-medium text-primary-600 dark:text-primary-400">
                  {t('products.uploadCategoryImage')}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                    className="hidden"
                    disabled={isSubmitting}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      event.target.value = '';
                      selectCategoryImage(file);
                    }}
                  />
                </label>
                {categoryImage && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => selectCategoryImage(null)}
                    className="block text-xs text-slate-400 hover:text-red-500 disabled:opacity-50"
                  >
                    {t('products.removeCategoryImage')}
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('products.categoryImageHint')}</p>
            {categoryImageError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{categoryImageError}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting} fullWidth>
            {isSubmitting ? t('common.loading') : t('products.addCategory')}
          </Button>
        </form>
      </Drawer>

      <Modal isOpen={showBulk} onClose={() => setShowBulk(false)} title={t('products.bulkPrice')}>
        <form onSubmit={handleBulkPrice} className="space-y-4">
          <Select
            label={t('products.bulkPrice')}
            value={bulkMode}
            onChange={(e) => setBulkMode(e.target.value as 'percent' | 'amount')}
            options={[
              { value: 'percent', label: t('products.bulkPercent') },
              { value: 'amount', label: t('products.bulkAmount') },
            ]}
            fullWidth
          />
          <Input
            label={t('products.bulkValue')}
            type="number"
            step="0.01"
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
            required
            fullWidth
          />
          <p className="text-sm text-gray-500 dark:text-gray-400">{selectedIds.length}</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowBulk(false)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={isSubmitting}>{t('products.bulkApply')}</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
};
