import React, { useEffect, useState } from 'react';
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
import { Table } from '@/components/common/Table';
import { DropdownMenu } from '@/components/common/DropdownMenu';
import { expensesApi } from '@/api/expenses';
import { formatCurrency, formatDate, getErrorMessage } from '@/utils/format';
import type { Expense, ExpenseCategory, ExpenseCreate, ExpenseUpdate, ExpenseCategoryCreate, ExpenseHistory } from '@/types/entities';

export const ExpensesPage: React.FC = () => {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseHistory, setExpenseHistory] = useState<ExpenseHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [editFormData, setEditFormData] = useState<ExpenseUpdate>({});

  const [formData, setFormData] = useState<ExpenseCreate>({
    amount: 0,
    description: '',
    category_id: 0,
    date: new Date().toISOString().split('T')[0],
  });

  const [categoryFormData, setCategoryFormData] = useState<ExpenseCategoryCreate>({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [expensesData, categoriesData] = await Promise.all([
        expensesApi.list({
          category_id: selectedCategory || undefined,
        }),
        expensesApi.listCategories(),
      ]);

      setExpenses(expensesData.items);
      setCategories(categoriesData.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || t('errors.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await expensesApi.create(formData);
      setShowCreateModal(false);
      setFormData({
        amount: 0,
        description: '',
        category_id: 0,
        date: new Date().toISOString().split('T')[0],
      });
      await loadData();
    } catch (err: any) {
      alert(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;
    try {
      setIsSubmitting(true);
      await expensesApi.update(selectedExpense.id, editFormData);
      setShowEditModal(false);
      setSelectedExpense(null);
      await loadData();
    } catch (err: any) {
      alert(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm(t('expenses.confirmDeleteExpense'))) return;
    try {
      await expensesApi.delete(id);
      await loadData();
    } catch (err: any) {
      alert(getErrorMessage(err, t('errors.deleteFailed')));
    }
  };

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setEditFormData({
      amount: expense.amount,
      description: expense.description,
      category_id: expense.category_id,
      date: expense.date,
    });
    setShowEditModal(true);
  };

  const openHistoryModal = async (expense: Expense) => {
    setSelectedExpense(expense);
    setShowHistoryModal(true);
    setIsLoadingHistory(true);
    try {
      const history = await expensesApi.getHistory(expense.id);
      setExpenseHistory(history);
    } catch (err: any) {
      setExpenseHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await expensesApi.createCategory(categoryFormData);
      setShowCategoryModal(false);
      setCategoryFormData({ name: '', description: '' });
      await loadData();
    } catch (err: any) {
      alert(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm(t('expenses.confirmDeleteCategory'))) return;
    try {
      await expensesApi.deleteCategory(categoryId);
      await loadData();
    } catch (err: any) {
      alert(getErrorMessage(err, t('errors.deleteFailed')));
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const columns = [
    {
      key: 'date',
      header: t('expenses.date'),
      render: (expense: Expense) => formatDate(expense.date),
    },
    {
      key: 'category',
      header: t('expenses.category'),
      render: (expense: Expense) => (
        <Badge variant="default">
          {expense.category_name || '-'}
        </Badge>
      ),
    },
    {
      key: 'description',
      header: t('expenses.description'),
      render: (expense: Expense) => (
        <span className="text-gray-900 dark:text-gray-100">
          {expense.description}
        </span>
      ),
    },
    {
      key: 'amount',
      header: t('expenses.amount'),
      render: (expense: Expense) => (
        <span className="font-semibold text-red-600 dark:text-red-400">
          {formatCurrency(expense.amount)}
        </span>
      ),
    },
    {
      key: 'created_by',
      header: t('expenses.createdBy'),
      render: (expense: Expense) => (
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {expense.created_by_username || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (expense: Expense) => (
        <DropdownMenu
          items={[
            {
              label: t('common.edit'),
              onClick: () => openEditModal(expense),
            },
            {
              label: t('expenses.history'),
              onClick: () => openHistoryModal(expense),
            },
            {
              label: t('common.delete'),
              onClick: () => handleDeleteExpense(expense.id),
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('expenses.title')}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('expenses.totalExpenses')}: <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowCategoryModal(true)}>
              {t('expenses.manageCategories')}
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              {t('expenses.createExpense')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select
                  label={t('expenses.filterByCategory')}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : '')}
                  options={[
                    { value: '', label: t('expenses.allCategories') },
                    ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
                  ]}
                  fullWidth
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Expenses Table */}
        <Card>
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <ErrorMessage message={error} />
            ) : expenses.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  {t('expenses.noExpenses')}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('expenses.createExpense')}
                </p>
              </div>
            ) : (
              <Table columns={columns} data={expenses} />
            )}
          </div>
        </Card>

        {/* Create Expense Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={t('expenses.createExpense')}
        >
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <Select
              label={t('expenses.category')}
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
              options={[
                { value: '', label: t('expenses.category') },
                ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
              ]}
              required
              fullWidth
            />

            <Input
              label={t('expenses.amount')}
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              required
            />

            <Input
              label={t('expenses.date')}
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />

            <Input
              label={t('expenses.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('common.loading') : t('common.save')}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Expense Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setSelectedExpense(null); }}
          title={t('expenses.editExpense')}
        >
          <form onSubmit={handleEditExpense} className="space-y-4">
            <Select
              label={t('expenses.category')}
              value={editFormData.category_id || 0}
              onChange={(e) => setEditFormData({ ...editFormData, category_id: parseInt(e.target.value) })}
              options={[
                { value: '', label: t('expenses.category') },
                ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
              ]}
              required
              fullWidth
            />

            <Input
              label={t('expenses.amount')}
              type="number"
              step="0.01"
              min="0"
              value={editFormData.amount || 0}
              onChange={(e) => setEditFormData({ ...editFormData, amount: parseFloat(e.target.value) })}
              required
            />

            <Input
              label={t('expenses.date')}
              type="date"
              value={editFormData.date || ''}
              onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
              required
            />

            <Input
              label={t('expenses.description')}
              value={editFormData.description || ''}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              required
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowEditModal(false); setSelectedExpense(null); }}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('common.loading') : t('common.saveChanges')}
              </Button>
            </div>
          </form>
        </Modal>

        {/* History Modal */}
        <Modal
          isOpen={showHistoryModal}
          onClose={() => { setShowHistoryModal(false); setSelectedExpense(null); setExpenseHistory([]); }}
          title={`${t('expenses.history')}: ${selectedExpense?.description || ''}`}
        >
          {isLoadingHistory ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : expenseHistory.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('expenses.noHistory')}</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {expenseHistory.map((entry) => (
                <div key={entry.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {entry.field_name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(entry.changed_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-red-600 dark:text-red-400 line-through">{entry.old_value}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span className="text-green-600 dark:text-green-400">{entry.new_value}</span>
                  </div>
                  <div className="mt-1 flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{entry.changed_by_username}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>

        {/* Manage Categories Modal */}
        <Modal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          title={t('expenses.manageCategories')}
        >
          <div className="space-y-4">
            <form onSubmit={handleCreateCategory} className="space-y-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {t('expenses.createCategory')}
              </h3>
              <Input
                label={t('expenses.categoryName')}
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                required
              />
              <Input
                label={t('expenses.categoryDescription')}
                value={categoryFormData.description || ''}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
              />
              <Button type="submit" disabled={isSubmitting} fullWidth>
                {isSubmitting ? t('common.loading') : t('expenses.addCategory')}
              </Button>
            </form>

            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('expenses.existingCategories')}
              </h3>
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('expenses.noCategories')}
                </p>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </p>
                        {category.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {category.description}
                          </p>
                        )}
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
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
};
