import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { NotesPanel } from '@/components/common/NotesPanel';
import { contactsApi } from '@/api/contacts';
import { formatDate, getErrorMessage } from '@/utils/format';
import type { Contact, ContactUpdate } from '@/types/entities';
import { EntityType } from '@/types/enums';

export const ContactDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ContactUpdate>({});

  useEffect(() => {
    if (id) {
      loadContactData();
    }
  }, [id]);

  const loadContactData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const contactData = await contactsApi.get(parseInt(id!));
      setContact(contactData);
      setFormData({
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        website: contactData.website,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load contact data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await contactsApi.update(parseInt(id!), formData);
      await loadContactData();
      setIsEditing(false);
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to update contact'));
    } finally {
      setIsSaving(false);
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

  if (error || !contact) {
    return (
      <AppLayout>
        <ErrorMessage message={error || 'Contact not found'} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/contacts')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{contact.name}</h1>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>{t('contacts.editContact')}</Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title={t('contacts.contactInfo')}>
              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <Input
                    label={t('contacts.name')}
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    fullWidth
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={t('contacts.phone')}
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      fullWidth
                    />
                    <Input
                      label={t('contacts.email')}
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      fullWidth
                    />
                  </div>
                  <Input
                    label={t('contacts.website')}
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    fullWidth
                  />
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="secondary" onClick={() => setIsEditing(false)} type="button">
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" loading={isSaving}>
                      {t('common.saveChanges')}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('contacts.phone')}</label>
                      <p className="text-gray-900 dark:text-gray-100">{contact.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('contacts.email')}</label>
                      <p className="text-gray-900 dark:text-gray-100">{contact.email || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('contacts.website')}</label>
                    <p className="text-gray-900 dark:text-gray-100">{contact.website || '-'}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('common.createdAt')}: {formatDate(contact.created_at)}
                      {contact.created_by_username && (
                        <> | {t('contacts.createdBy')}: <span className="font-medium">{contact.created_by_username}</span></>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* Related Customers */}
            <Card title={t('contacts.relatedCustomers')}>
              {(!contact.customers || contact.customers.length === 0) ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('contacts.noCustomers')}</p>
              ) : (
                <div className="space-y-3">
                  {contact.customers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750/50 cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{customer.name}</h4>
                          <div className="mt-1 space-y-1">
                            {customer.phone && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="inline-flex items-center">
                                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  {customer.phone}
                                </span>
                              </p>
                            )}
                            {customer.email && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="inline-flex items-center">
                                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {customer.email}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div>
            <NotesPanel
              entityType={EntityType.CONTACT}
              entityId={parseInt(id!)}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
