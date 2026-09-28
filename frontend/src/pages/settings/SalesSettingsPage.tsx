import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/layout/BackButton';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { TextArea } from '@/components/common/TextArea';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { siteSettingsApi } from '@/api/publicSite';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/utils/format';
import type { SiteContent } from '@/types/site';

export const SalesSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState<SiteContent | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    siteSettingsApi.get()
      .then(setForm)
      .catch((err) => setError(getErrorMessage(err, t('errors.loadFailed'))));
  }, [t]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    try {
      setSaving(true);
      setError('');
      const updated = await siteSettingsApi.update(form);
      setForm(updated);
      setSaved(true);
    } catch (err) {
      setError(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setSaving(false);
    }
  };

  if (!user?.is_admin) {
    return (
      <AppLayout>
        <p className="text-sm text-gray-600 dark:text-gray-300">{t('site.adminOnly')}</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-1">
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('site.salesTitle')}</h1>
        </div>
        {!form && !error && <LoadingSpinner size="lg" />}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {form && (
          <form onSubmit={handleSave} className="max-w-xl space-y-6">
            <Card title={t('nav.salesSettings')}>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={form.order_out_of_stock}
                  onChange={(event) => {
                    setSaved(false);
                    setForm({ ...form, order_out_of_stock: event.target.checked });
                  }}
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">{t('site.orderOutOfStock')}</span>
                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{t('site.orderOutOfStockHint')}</span>
                </span>
              </label>
            </Card>
            <Card title={t('site.consultantWhatsapp')}>
              <div className="space-y-4">
                <TextArea
                  label={t('site.turkish')}
                  value={form.consultant_whatsapp_tr}
                  onChange={(event) => {
                    setSaved(false);
                    setForm({ ...form, consultant_whatsapp_tr: event.target.value });
                  }}
                  fullWidth
                  rows={3}
                />
                <TextArea
                  label={t('site.english')}
                  value={form.consultant_whatsapp_en}
                  onChange={(event) => {
                    setSaved(false);
                    setForm({ ...form, consultant_whatsapp_en: event.target.value });
                  }}
                  fullWidth
                  rows={3}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('site.consultantWhatsappHint')}</p>
              </div>
            </Card>
            {saved && <p className="text-sm text-emerald-600">{t('site.salesSaved')}</p>}
            <Button type="submit" disabled={saving}>{saving ? t('common.loading') : t('common.save')}</Button>
          </form>
        )}
      </div>
    </AppLayout>
  );
};
