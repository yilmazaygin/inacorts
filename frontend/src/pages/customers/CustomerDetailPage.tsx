import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { NotesPanel } from '@/components/common/NotesPanel';
import { customersApi } from '@/api/customers';
import { contactsApi } from '@/api/contacts';
import { ordersApi } from '@/api/orders';
import { formatDate, formatCurrency, getErrorMessage } from '@/utils/format';
import type { Customer, CustomerUpdate, Order, Contact } from '@/types/entities';
import { EntityType, OrderStatus } from '@/types/enums';

export const CustomerDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CustomerUpdate>({});
  const [showContactModal, setShowContactModal] = useState(false);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<number | ''>('');
  const [isContactSaving, setIsContactSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadCustomerData();
    }
  }, [id]);

  const loadCustomerData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const customerId = parseInt(id!);
      
      const [customerData, ordersData] = await Promise.all([
        customersApi.get(customerId),
        ordersApi.list({ customer_id: customerId, page_size: 100 }),
      ]);

      setCustomer(customerData);
      setOrders(ordersData.items);
      setFormData({
        name: customerData.name,
        address: customerData.address,
        phone: customerData.phone,
        email: customerData.email,
        website: customerData.website,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load customer data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await customersApi.update(parseInt(id!), formData);
      await loadCustomerData();
      setIsEditing(false);
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to update customer'));
    } finally {
      setIsSaving(false);
    }
  };

  const loadAllContacts = async () => {
    try {
      const data = await contactsApi.list({ page_size: 1000 });
      setAllContacts(data.items);
    } catch (err: any) {
      console.error('Failed to load contacts:', err);
    }
  };

  const handleAddContact = async () => {
    if (!selectedContactId || !customer) return;
    try {
      setIsContactSaving(true);
      const currentContactIds = (customer.contacts || []).map((c) => c.id);
      await customersApi.update(parseInt(id!), {
        contact_ids: [...currentContactIds, selectedContactId as number],
      });
      setSelectedContactId('');
      setShowContactModal(false);
      await loadCustomerData();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to add contact'));
    } finally {
      setIsContactSaving(false);
    }
  };

  const handleRemoveContact = async (contactId: number) => {
    if (!customer) return;
    try {
      setIsContactSaving(true);
      const currentContactIds = (customer.contacts || []).map((c) => c.id);
      await customersApi.update(parseInt(id!), {
        contact_ids: currentContactIds.filter((cid) => cid !== contactId),
      });
      await loadCustomerData();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to remove contact'));
    } finally {
      setIsContactSaving(false);
    }
  };

  const openContactModal = async () => {
    await loadAllContacts();
    setSelectedContactId('');
    setShowContactModal(true);
  };

  // Filter out contacts already linked to this customer
  const availableContacts = allContacts.filter(
    (c) => !(customer?.contacts || []).some((cc) => cc.id === c.id)
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !customer) {
    return (
      <AppLayout>
        <ErrorMessage message={error || 'Customer not found'} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/customers')}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.name}</h1>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>{t('customers.editCustomer')}</Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title={t('customers.customerInfo')}>
              {isEditing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <Input
                    label={t('customers.name')}
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    fullWidth
                  />
                  <Input
                    label={t('customers.address')}
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    fullWidth
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={t('customers.phone')}
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      fullWidth
                    />
                    <Input
                      label={t('customers.email')}
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      fullWidth
                    />
                  </div>
                  <Input
                    label={t('customers.website')}
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
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('customers.address')}</label>
                    <p className="text-gray-900 dark:text-gray-100">{customer.address}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('customers.phone')}</label>
                      <p className="text-gray-900 dark:text-gray-100">{customer.phone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('customers.email')}</label>
                      <p className="text-gray-900 dark:text-gray-100">{customer.email || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('customers.website')}</label>
                    <p className="text-gray-900 dark:text-gray-100">{customer.website || '-'}</p>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('common.createdAt')}: {formatDate(customer.created_at)}
                      {customer.created_by_username && (
                        <> | {t('customers.createdBy')}: <span className="font-medium">{customer.created_by_username}</span></>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* Customer Contacts Section */}
            <Card title={t('customers.contacts')}>
              <div className="space-y-3">
                {customer.contacts && customer.contacts.length > 0 ? (
                  customer.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750/50"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => navigate(`/contacts/${contact.id}`)}
                        >
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{contact.name}</h4>
                          <div className="mt-1 space-y-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="inline-flex items-center">
                                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {contact.phone}
                              </span>
                            </p>
                            {contact.email && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="inline-flex items-center">
                                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {contact.email}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRemoveContact(contact.id)}
                          loading={isContactSaving}
                        >
                          {t('common.remove')}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">{t('customers.noContacts')}</p>
                )}
                <Button variant="secondary" onClick={openContactModal} fullWidth>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('customers.addContact')}
                </Button>
              </div>
            </Card>

            <Card title={t('customers.orders')}>
              {orders.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('orders.noOrders')}</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750/50 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{t('orders.orderNumber')}{order.id}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(order.total_amount)}</p>
                          <div className="mt-1">
                            <Badge variant={order.order_status === OrderStatus.COMPLETED ? 'success' : 'default'} size="sm">
                              {order.order_status === OrderStatus.COMPLETED ? t('orders.statusCompleted') : order.order_status === OrderStatus.CANCELED ? t('orders.statusCanceled') : t('orders.statusOpen')}
                            </Badge>
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
              entityType={EntityType.CUSTOMER}
              entityId={parseInt(id!)}
            />
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title={t('customers.addContact')}
      >
        <div className="space-y-4">
          {availableContacts.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">{t('customers.noAvailableContacts')}</p>
          ) : (
            <>
              <Select
                label={t('contacts.name')}
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value ? parseInt(e.target.value) : '')}
                options={availableContacts.map((c) => ({ value: c.id, label: `${c.name} (${c.phone})` }))}
                placeholder={t('customers.selectContact')}
                fullWidth
              />
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="secondary" onClick={() => setShowContactModal(false)} type="button">
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleAddContact}
                  loading={isContactSaving}
                  disabled={!selectedContactId}
                >
                  {t('common.add')}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </AppLayout>
  );
};