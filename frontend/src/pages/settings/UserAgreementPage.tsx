import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/layout/BackButton';
import { Card } from '@/components/common/Card';
import { TextArea } from '@/components/common/TextArea';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { agreementApi } from '@/api/publicSite';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTime, getErrorMessage } from '@/utils/format';
import type { AgreementAdmin } from '@/types/site';

export const UserAgreementPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState<AgreementAdmin | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    agreementApi.get()
      .then(setForm)
      .catch((err) => setError(getErrorMessage(err, t('errors.loadFailed'))));
  }, [t]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    try {
      setSaving(true);
      setError('');
      const updated = await agreementApi.update({ body_tr: form.body_tr, body_en: form.body_en });
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('site.userAgreement')}</h1>
        </div>
        {!form && !error && <LoadingSpinner size="lg" />}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {form && (
          <>
            <form onSubmit={handleSave} className="space-y-6">
              <p className="text-sm text-gray-500">{t('site.lastEdited', { date: formatDateTime(form.updated_at) })}</p>
            <p className="text-sm text-gray-500">{t('site.agreementFormatHint')}</p>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card title={t('site.turkish')}>
                  <TextArea
                    value={form.body_tr}
                    onChange={(event) => {
                      setSaved(false);
                      setForm({ ...form, body_tr: event.target.value });
                    }}
                    rows={16}
                    fullWidth
                    required
                  />
                </Card>
                <Card title={t('site.english')}>
                  <TextArea
                    value={form.body_en}
                    onChange={(event) => {
                      setSaved(false);
                      setForm({ ...form, body_en: event.target.value });
                    }}
                    rows={16}
                    fullWidth
                    required
                  />
                </Card>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" loading={saving}>{t('common.save')}</Button>
                {saved && <span className="text-sm text-emerald-600">{t('site.agreementSaved')}</span>}
              </div>
            </form>
            <Card title={t('site.agreementLog')}>
              {form.logs.length === 0 ? (
                <p className="text-sm text-gray-500">{t('site.agreementNoLogs')}</p>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {form.logs.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{entry.username}</span>
                      <span className="text-gray-500">{formatDateTime(entry.edited_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};
