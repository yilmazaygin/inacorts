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
import { Badge } from '@/components/common/Badge';
import { Pagination } from '@/components/common/Pagination';
import { usersApi } from '@/api/users';
import { authApi } from '@/api/auth';
import { formatDate, getErrorMessage } from '@/utils/format';
import type { User, UserCreate, UserUpdate } from '@/types/entities';

export const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UserCreate>({
    username: '',
    password: '',
    email: '',
    is_admin: false,
    name: '',
    surname: '',
    address: '',
    backup_email: '',
    phone_number: '',
  });

  // Admin password confirmation
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  const [adminPasswordLoading, setAdminPasswordLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<'create' | 'deactivate' | null>(null);

  // Deactivate
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // User detail panel
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [detailForm, setDetailForm] = useState<UserUpdate>({});
  const [detailError, setDetailError] = useState('');
  const [detailSuccess, setDetailSuccess] = useState('');
  const [detailSubmitting, setDetailSubmitting] = useState(false);
  const [showDetailAnswer1, setShowDetailAnswer1] = useState(false);
  const [showDetailAnswer2, setShowDetailAnswer2] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await usersApi.list({ page, page_size: 20, search: search || undefined });
      setUsers(data.items);
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

  // --- Admin password confirmation flow ---
  const requestAdminPassword = (action: 'create' | 'deactivate') => {
    setPendingAction(action);
    setAdminPassword('');
    setAdminPasswordError('');
    setShowAdminPasswordModal(true);
  };

  const handleAdminPasswordConfirm = async () => {
    setAdminPasswordError('');
    setAdminPasswordLoading(true);
    try {
      await authApi.verifyPassword({ password: adminPassword });
      setShowAdminPasswordModal(false);
      if (pendingAction === 'create') {
        await executeCreate();
      } else if (pendingAction === 'deactivate') {
        await executeDeactivate();
      }
    } catch (err: any) {
      setAdminPasswordError(getErrorMessage(err, t('users.incorrectPassword')));
    } finally {
      setAdminPasswordLoading(false);
    }
  };

  // --- Create user flow ---
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Close create modal first, then request admin password
    setShowCreateModal(false);
    requestAdminPassword('create');
  };

  const executeCreate = async () => {
    try {
      setIsSubmitting(true);
      await usersApi.create(formData);
      resetForm();
      loadUsers();
    } catch (err: any) {
      alert(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '', password: '', email: '', is_admin: false,
      name: '', surname: '', address: '', backup_email: '', phone_number: '',
    });
  };

  // --- Deactivate user flow ---
  const openDeactivateModal = (user: User) => {
    setSelectedUser(user);
    setShowDeactivateModal(true);
  };

  const handleDeactivateConfirm = () => {
    setShowDeactivateModal(false);
    requestAdminPassword('deactivate');
  };

  const executeDeactivate = async () => {
    if (!selectedUser) return;
    try {
      setIsSubmitting(true);
      await usersApi.deactivate(selectedUser.id);
      setSelectedUser(null);
      loadUsers();
      // Refresh detail if open
      if (detailUser && detailUser.id === selectedUser.id) {
        loadUserDetail(selectedUser.id);
      }
    } catch (err: any) {
      alert(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- User detail panel ---
  const loadUserDetail = async (userId: number) => {
    setDetailLoading(true);
    setDetailError('');
    setDetailSuccess('');
    try {
      const userData = await usersApi.getById(userId);
      setDetailUser(userData);
      setDetailForm({
        email: userData.email || '',
        is_admin: userData.is_admin,
        name: userData.name || '',
        surname: userData.surname || '',
        address: userData.address || '',
        backup_email: userData.backup_email || '',
        phone_number: userData.phone_number || '',
      });
    } catch (err: any) {
      setDetailError(getErrorMessage(err, t('errors.loadFailed')));
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetailModal = (user: User) => {
    setDetailUser(user);
    setShowDetailModal(true);
    setIsEditingDetail(false);
    setDetailError('');
    setDetailSuccess('');
    setShowDetailAnswer1(false);
    setShowDetailAnswer2(false);
    loadUserDetail(user.id);
  };

  const handleDetailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailUser) return;
    setDetailError('');
    setDetailSuccess('');
    try {
      setDetailSubmitting(true);
      await usersApi.update(detailUser.id, detailForm);
      setDetailSuccess(t('users.userUpdated'));
      setIsEditingDetail(false);
      await loadUserDetail(detailUser.id);
      loadUsers();
    } catch (err: any) {
      setDetailError(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setDetailSubmitting(false);
    }
  };

  const columns = [
    { key: 'id', header: t('common.id'), className: 'w-16' },
    {
      key: 'username',
      header: t('users.username'),
      render: (u: User) => (
        <button
          onClick={() => openDetailModal(u)}
          className="flex items-center space-x-2 text-left hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <span className={!u.is_active ? 'text-gray-400 dark:text-gray-500 line-through' : ''}>
            {u.username}
          </span>
          {!u.is_active && (
            <Badge variant="danger" size="sm">{t('users.deactivated')}</Badge>
          )}
        </button>
      ),
    },
    {
      key: 'email',
      header: t('users.email'),
      render: (u: User) => u.email || '-',
    },
    {
      key: 'role',
      header: t('users.role'),
      render: (u: User) => (
        <Badge variant={u.is_admin ? 'info' : 'default'} size="sm">
          {u.is_admin ? t('users.admin') : t('users.user')}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: t('users.status'),
      render: (u: User) => (
        <Badge variant={u.is_active ? 'success' : 'danger'} size="sm">
          {u.is_active ? t('users.active') : t('users.deactivated')}
        </Badge>
      ),
    },
    {
      key: 'created_by',
      header: t('users.createdBy'),
      render: (u: User) => (
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300">{u.created_by_username || '-'}</span>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: t('users.createdAt'),
      render: (u: User) => u.created_at ? formatDate(u.created_at) : '-',
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (u: User) => u.is_active ? (
        <button
          onClick={(e) => { e.stopPropagation(); openDeactivateModal(u); }}
          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
          title={t('users.deactivateUser')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </button>
      ) : null,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('users.title')}</h1>
            {!isLoading && users.length > 0 && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('users.totalUsers', { count: users.length })}
              </p>
            )}
          </div>
          <Button onClick={openCreateModal}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('users.addUser')}
          </Button>
        </div>

        <Card>
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('users.searchPlaceholder')}
                fullWidth
              />
              <Button type="submit">{t('common.search')}</Button>
              {search && (
                <Button variant="secondary" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}>
                  {t('common.clear')}
                </Button>
              )}
            </div>
          </form>

          {error && <ErrorMessage message={error} onRetry={loadUsers} />}

          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <Table columns={columns} data={users} />
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </Card>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title={t('users.addUser')}
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('users.username')}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              fullWidth
            />
            <Input
              label={t('users.password')}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              fullWidth
            />
            <Input
              label={t('users.name')}
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <Input
              label={t('users.surname')}
              value={formData.surname || ''}
              onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
              fullWidth
            />
            <Input
              label={t('users.email')}
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            <Input
              label={t('users.backupEmail')}
              type="email"
              value={formData.backup_email || ''}
              onChange={(e) => setFormData({ ...formData, backup_email: e.target.value })}
              fullWidth
            />
            <Input
              label={t('users.phoneNumber')}
              value={formData.phone_number || ''}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              fullWidth
            />
            <Input
              label={t('users.address')}
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_admin"
              checked={formData.is_admin || false}
              onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="is_admin" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('users.isAdmin')}
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowCreateModal(false); resetForm(); }} type="button">
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deactivate User Confirmation Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => { setShowDeactivateModal(false); setSelectedUser(null); }}
        title={t('users.deactivateUser')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            {t('users.confirmDeactivate')}
          </p>
          {selectedUser && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p className="font-medium text-gray-900 dark:text-white">{selectedUser.username}</p>
              {selectedUser.email && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
              )}
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowDeactivateModal(false); setSelectedUser(null); }}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDeactivateConfirm} loading={isSubmitting}>
              {t('users.deactivateUser')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Admin Password Confirmation Modal */}
      <Modal
        isOpen={showAdminPasswordModal}
        onClose={() => { setShowAdminPasswordModal(false); setPendingAction(null); }}
        title={t('users.adminPasswordConfirmation')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('users.adminPasswordDescription')}</p>
          {adminPasswordError && <ErrorMessage message={adminPasswordError} />}
          <Input
            label={t('users.yourPassword')}
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            fullWidth
            autoFocus
          />
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowAdminPasswordModal(false); setPendingAction(null); }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAdminPasswordConfirm} loading={adminPasswordLoading} disabled={!adminPassword}>
              {t('common.confirm')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* User Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setDetailUser(null); setIsEditingDetail(false); }}
        title={t('users.userDetails')}
        size="lg"
      >
        {detailLoading ? (
          <div className="py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : detailUser ? (
          <div className="space-y-6">
            {/* User header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {detailUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{detailUser.username}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={detailUser.is_admin ? 'info' : 'default'} size="sm">
                      {detailUser.is_admin ? t('users.admin') : t('users.user')}
                    </Badge>
                    <Badge variant={detailUser.is_active ? 'success' : 'danger'} size="sm">
                      {detailUser.is_active ? t('users.active') : t('users.deactivated')}
                    </Badge>
                  </div>
                </div>
              </div>
              {!isEditingDetail && detailUser.is_active && (
                <Button variant="secondary" onClick={() => setIsEditingDetail(true)}>
                  {t('common.edit')}
                </Button>
              )}
            </div>

            {detailError && <ErrorMessage message={detailError} />}
            {detailSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-300">{detailSuccess}</p>
              </div>
            )}

            {/* Editable fields */}
            {isEditingDetail ? (
              <form onSubmit={handleDetailSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('users.name')}
                    value={detailForm.name || ''}
                    onChange={(e) => setDetailForm({ ...detailForm, name: e.target.value })}
                    fullWidth
                  />
                  <Input
                    label={t('users.surname')}
                    value={detailForm.surname || ''}
                    onChange={(e) => setDetailForm({ ...detailForm, surname: e.target.value })}
                    fullWidth
                  />
                  <Input
                    label={t('users.email')}
                    type="email"
                    value={detailForm.email || ''}
                    onChange={(e) => setDetailForm({ ...detailForm, email: e.target.value })}
                    fullWidth
                  />
                  <Input
                    label={t('users.backupEmail')}
                    type="email"
                    value={detailForm.backup_email || ''}
                    onChange={(e) => setDetailForm({ ...detailForm, backup_email: e.target.value })}
                    fullWidth
                  />
                  <Input
                    label={t('users.phoneNumber')}
                    value={detailForm.phone_number || ''}
                    onChange={(e) => setDetailForm({ ...detailForm, phone_number: e.target.value })}
                    fullWidth
                  />
                  <Input
                    label={t('users.address')}
                    value={detailForm.address || ''}
                    onChange={(e) => setDetailForm({ ...detailForm, address: e.target.value })}
                    fullWidth
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="detail_is_admin"
                    checked={detailForm.is_admin || false}
                    onChange={(e) => setDetailForm({ ...detailForm, is_admin: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="detail_is_admin" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('users.isAdmin')}
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <Button variant="secondary" onClick={() => setIsEditingDetail(false)} type="button">
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" loading={detailSubmitting}>
                    {t('common.saveChanges')}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: t('users.name'), value: detailUser.name },
                  { label: t('users.surname'), value: detailUser.surname },
                  { label: t('users.email'), value: detailUser.email },
                  { label: t('users.backupEmail'), value: detailUser.backup_email },
                  { label: t('users.phoneNumber'), value: detailUser.phone_number },
                  { label: t('users.address'), value: detailUser.address },
                  { label: t('users.createdBy'), value: detailUser.created_by_username },
                  { label: t('users.createdAt'), value: detailUser.created_at ? formatDate(detailUser.created_at) : undefined },
                ].map((field, idx) => (
                  <div key={idx}>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{field.label}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{field.value || '-'}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Security Questions (admin view, read-only with masked answers) */}
            {detailUser.has_security_questions && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">{t('users.securityQuestions')}</h4>
                <div className="space-y-3">
                  {/* Q1 */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('users.question1')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{detailUser.security_question_1 || '-'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('users.answer1')}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white tracking-widest">
                        {showDetailAnswer1 ? t('users.answersHashed') : '••••••••'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowDetailAnswer1(!showDetailAnswer1)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showDetailAnswer1 ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.879L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  {/* Q2 */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('users.question2')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{detailUser.security_question_2 || '-'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('users.answer2')}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white tracking-widest">
                        {showDetailAnswer2 ? t('users.answersHashed') : '••••••••'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowDetailAnswer2(!showDetailAnswer2)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showDetailAnswer2 ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.879L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Deactivated timestamp */}
            {!detailUser.is_active && detailUser.deactivated_at && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('users.deactivatedAt')}</p>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">{formatDate(detailUser.deactivated_at)}</p>
              </div>
            )}
          </div>
        ) : (
          detailError && <ErrorMessage message={detailError} />
        )}
      </Modal>
    </AppLayout>
  );
};
