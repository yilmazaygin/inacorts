import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { contactsApi } from '@/api/contacts';
import { formatDate, getErrorMessage } from '@/utils/format';
import type { Contact, ContactCreate } from '@/types/entities';

export const ContactsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ContactCreate>({
    name: '',
    phone: '',
    email: '',
    website: '',
  });

  useEffect(() => {
    loadContacts();
  }, [page, search]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await contactsApi.list({ page, page_size: 20, search: search || undefined });
      setContacts(data.items);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (isEditing && selectedContact) {
        await contactsApi.update(selectedContact.id, formData);
      } else {
        await contactsApi.create(formData);
      }
      setShowModal(false);
      resetForm();
      loadContacts();
    } catch (err: any) {
      alert(getErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} contact`));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('common.confirmDelete'))) return;

    try {
      await contactsApi.delete(id);
      loadContacts();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to delete contact'));
    }
  };

  const openEditModal = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      website: contact.website,
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setIsEditing(false);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', website: '' });
    setSelectedContact(null);
  };

  const columns = [
    { key: 'id', header: t('common.id'), className: 'w-20' },
    { key: 'name', header: t('contacts.name') },
    { key: 'phone', header: t('contacts.phone') },
    { key: 'email', header: t('contacts.email'), render: (c: Contact) => c.email || '-' },
    { key: 'created_by', header: t('contacts.createdBy'), render: (c: Contact) => (
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm text-gray-700 dark:text-gray-300">{c.created_by_username || '-'}</span>
        </div>
      ),
    },
    { key: 'created_at', header: t('common.createdAt'), render: (c: Contact) => formatDate(c.created_at) },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (c: Contact) => (
        <DropdownMenu
          items={[
            {
              label: t('common.view'),
              onClick: () => navigate(`/contacts/${c.id}`),
            },
            {
              label: t('common.edit'),
              onClick: () => openEditModal(c),
            },
            {
              label: t('common.delete'),
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('contacts.title')}</h1>
            {!isLoading && contacts.length > 0 && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('contacts.totalContacts', { count: contacts.length })}
              </p>
            )}
          </div>
          <Button onClick={openCreateModal}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('contacts.addContact')}
          </Button>
        </div>

        <Card>
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('contacts.searchPlaceholder')}
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

          {error && <ErrorMessage message={error} onRetry={loadContacts} />}

          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <Table columns={columns} data={contacts} onRowClick={(contact) => navigate(`/contacts/${contact.id}`)} />
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={isEditing ? t('contacts.editContact') : t('contacts.addContact')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('contacts.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />
          <Input
            label={t('contacts.phone')}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            fullWidth
          />
          <Input
            label={t('contacts.email')}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            fullWidth
          />
          <Input
            label={t('contacts.website')}
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            fullWidth
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }} type="button">
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? t('common.saveChanges') : t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
};
