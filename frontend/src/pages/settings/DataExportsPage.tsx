import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/layout/BackButton';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { exportsApi, type ExportKind } from '@/api/exports';
import { getErrorMessage } from '@/utils/format';

const kinds: ExportKind[] = [
  'customers',
  'contacts',
  'orders',
  'products',
  'stock',
  'payments',
  'expenses',
  'financials',
];

export const DataExportsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [busy, setBusy] = useState('');

  const download = async (kind: ExportKind, format: 'csv' | 'xlsx') => {
    const key = `${kind}-${format}`;
    try {
      setBusy(key);
      await exportsApi.download({
        kind,
        format,
        lang: i18n.language.startsWith('en') ? 'en' : 'tr',
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
    } catch (err) {
      alert(getErrorMessage(err, t('common.exportFailed')));
    } finally {
      setBusy('');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-1">
            <BackButton />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('exports.title')}</h1>
          </div>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{t('exports.subtitle')}</p>
        </div>

        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              <span className="mb-1 block font-medium">{t('common.startDate')}</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-300">
              <span className="mb-1 block font-medium">{t('common.endDate')}</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </label>
          </div>
        </Card>

        <Card>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {kinds.map((kind) => (
              <li key={kind} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t(`exports.${kind}`)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t(`exports.${kind}Hint`)}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    loading={busy === `${kind}-csv`}
                    disabled={Boolean(busy) && busy !== `${kind}-csv`}
                    onClick={() => download(kind, 'csv')}
                  >
                    {t('common.csv')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    loading={busy === `${kind}-xlsx`}
                    disabled={Boolean(busy) && busy !== `${kind}-xlsx`}
                    onClick={() => download(kind, 'xlsx')}
                  >
                    {t('common.excel')}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppLayout>
  );
};
