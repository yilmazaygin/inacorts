import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/Button';

interface ExportBarProps {
  startDate: string;
  endDate: string;
  onStartDate: (value: string) => void;
  onEndDate: (value: string) => void;
  onExport?: (format: 'csv' | 'xlsx') => void;
  exporting?: boolean;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  startDate,
  endDate,
  onStartDate,
  onEndDate,
  onExport,
  exporting,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex-1 text-sm text-gray-700 dark:text-gray-300">
        <span className="mb-1 block font-medium">{t('common.startDate')}</span>
        <input
          type="date"
          value={startDate}
          onChange={(event) => onStartDate(event.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </label>
      <label className="flex-1 text-sm text-gray-700 dark:text-gray-300">
        <span className="mb-1 block font-medium">{t('common.endDate')}</span>
        <input
          type="date"
          value={endDate}
          onChange={(event) => onEndDate(event.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </label>
      {onExport && (
        <div className="flex gap-2">
          <Button type="button" variant="secondary" loading={exporting} onClick={() => onExport('csv')}>
            {t('common.csv')}
          </Button>
          <Button type="button" variant="secondary" loading={exporting} onClick={() => onExport('xlsx')}>
            {t('common.excel')}
          </Button>
        </div>
      )}
    </div>
  );
};
