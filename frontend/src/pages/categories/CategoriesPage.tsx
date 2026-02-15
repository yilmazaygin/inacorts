import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Table } from '@/components/common/Table';
import { Pagination } from '@/components/common/Pagination';
import { DropdownMenu } from '@/components/common/DropdownMenu';
import { categoriesApi } from '@/api/categories';
import { formatDate, getErrorMessage } from '@/utils/format';
import type { Category, CategoryCreate } from '@/types/entities';

export const CategoriesPage: React.FC = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CategoryCreate>({ name: '' });

  useEffect(() => {
    loadCategories();
  }, [page]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await categoriesApi.list({ page, page_size: 20 });
      setCategories(data.items);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (isEditing && selectedCategory) {
        await categoriesApi.update(selectedCategory.id, formData);
      } else {
        await categoriesApi.create(formData);
      }
      setShowModal(false);
      resetForm();
      loadCategories();
    } catch (err: any) {
      alert(getErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} category`));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('common.confirmDelete'))) return;

    try {
      await categoriesApi.delete(id);
      loadCategories();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to delete category'));
    }
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({ name: category.name });
    setIsEditing(true);
    setShowModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setIsEditing(false);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setSelectedCategory(null);
  };

  const columns = [
    { key: 'id', header: 'ID', className: 'w-20' },
    { key: 'name', header: 'Category Name' },
    { key: 'created_at', header: 'Created', render: (c: Category) => formatDate(c.created_at) },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (c: Category) => (
        <DropdownMenu
          items={[
            {
              label: 'Edit',
              onClick: () => openEditModal(c),
            },
            {
              label: 'Delete',
              onClick: () => handleDelete(c.id),
              variant: 'danger',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <Button onClick={openCreateModal}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </Button>
        </div>

        <Card>
          {error && <ErrorMessage message={error} onRetry={loadCategories} />}

          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <Table columns={columns} data={categories} />
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={isEditing ? 'Edit Category' : 'Add New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
            autoFocus
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
};
