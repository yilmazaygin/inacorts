import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { TextArea } from '@/components/common/TextArea';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { siteSettingsApi } from '@/api/publicSite';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/utils/format';
import type { SiteContent } from '@/types/site';

const localizedFields: Array<{ key: string; label: string; area?: boolean }> = [
  { key: 'hero_title', label: 'site.heroTitle' },
  { key: 'hero_subtitle', label: 'site.heroSubtitle', area: true },
  { key: 'about', label: 'site.aboutText', area: true },
  { key: 'contact_intro', label: 'site.contactIntro', area: true },
  { key: 'feature1_title', label: 'site.featureTitle' },
  { key: 'feature1_text', label: 'site.featureText', area: true },
  { key: 'feature2_title', label: 'site.featureTitle' },
  { key: 'feature2_text', label: 'site.featureText', area: true },
  { key: 'feature3_title', label: 'site.featureTitle' },
  { key: 'feature3_text', label: 'site.featureText', area: true },
];

export const SiteSettingsPage: React.FC = () => {
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

  const setField = (key: keyof SiteContent, value: string) => {
    if (!form) return;
    setSaved(false);
    setForm({ ...form, [key]: value });
  };

  const featureIndex = (key: string) => {
    const match = key.match(/^feature(\d)/);
    return match ? match[1] : '';
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    try {
      setSaving(true);
      setError('');
      const updated = await siteSettingsApi.update({ ...form, company_name: form.company_name.trim(), tab_title: form.company_name.trim() });
      setForm(updated);
      setSaved(true);
      window.dispatchEvent(new Event('site-meta'));
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('nav.siteSettings')}</h1>
        {!form && !error && <LoadingSpinner size="lg" />}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {form && (
          <form onSubmit={handleSave} className="space-y-6">
            <Card title={t('site.systemName')}>
              <Input label={t('site.systemName')} value={form.company_name} onChange={(e) => setField('company_name', e.target.value)} fullWidth required />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('site.systemNameHint')}</p>
            </Card>
            <Card title={t('site.company')}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">{t('site.favicon')}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <img
                      src={form.favicon_url || '/favicon.svg'}
                      alt=""
                      className="h-10 w-10 rounded-md border border-gray-200 bg-white object-contain dark:border-slate-700"
                    />
                    <label className="cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-800">
                      {t('site.faviconUpload')}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif,.ico"
                        className="sr-only"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];
                          event.target.value = '';
                          if (!file) return;
                          try {
                            setError('');
                            const updated = await siteSettingsApi.uploadFavicon(file);
                            setForm((current) => current ? { ...current, favicon_url: updated.favicon_url ?? null } : updated);
                            window.dispatchEvent(new Event('site-meta'));
                          } catch (err) {
                            setError(getErrorMessage(err, t('errors.saveFailed')));
                          }
                        }}
                      />
                    </label>
                    {form.favicon_url && (
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={async () => {
                          try {
                            setError('');
                            await siteSettingsApi.deleteFavicon();
                            setForm((current) => current ? { ...current, favicon_url: null } : current);
                            window.dispatchEvent(new Event('site-meta'));
                          } catch (err) {
                            setError(getErrorMessage(err, t('errors.saveFailed')));
                          }
                        }}
                      >
                        {t('site.remove')}
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('site.faviconHint')}</p>
                </div>
                <Input label={t('site.phone')} value={form.phone} onChange={(e) => setField('phone', e.target.value)} fullWidth required />
                <Input label={t('site.email')} type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} fullWidth required />
                <Input label={t('site.hours')} value={form.hours} onChange={(e) => setField('hours', e.target.value)} fullWidth required />
                <div className="sm:col-span-2">
                  <TextArea label={t('site.address')} value={form.address} onChange={(e) => setField('address', e.target.value)} fullWidth required />
                </div>
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {(['tr', 'en'] as const).map((lang) => (
                <Card key={lang} title={lang === 'tr' ? t('site.turkish') : t('site.english')}>
                  <div className="space-y-4">
                    {localizedFields.map((field) => {
                      const name = `${field.key}_${lang}` as keyof SiteContent;
                      const label = field.key.startsWith('feature')
                        ? t(field.label, { n: featureIndex(field.key) })
                        : t(field.label);
                      return field.area ? (
                        <TextArea
                          key={name}
                          label={label}
                          value={String(form[name] ?? '')}
                          onChange={(e) => setField(name, e.target.value)}
                          fullWidth
                          required
                        />
                      ) : (
                        <Input
                          key={name}
                          label={label}
                          value={String(form[name] ?? '')}
                          onChange={(e) => setField(name, e.target.value)}
                          fullWidth
                          required
                        />
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" loading={saving}>{t('common.saveChanges')}</Button>
              {saved && <span className="text-sm text-emerald-600">{t('site.saved')}</span>}
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
};
