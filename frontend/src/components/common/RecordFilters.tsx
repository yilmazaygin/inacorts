import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from '@/components/common/Select';
import { usersApi, type UserLookup } from '@/api/users';
import { tagsApi } from '@/api/tags';
import type { Tag } from '@/types/entities';

export interface RecordFilterValue {
  createdBy: string;
  startDate: string;
  endDate: string;
  tagId: string;
}

interface RecordFiltersProps {
  value: RecordFilterValue;
  onChange: (next: RecordFilterValue) => void;
  showDates?: boolean;
}

export const emptyRecordFilters = (): RecordFilterValue => ({
  createdBy: '',
  startDate: '',
  endDate: '',
  tagId: '',
});

export const RecordFilters: React.FC<RecordFiltersProps> = ({ value, onChange, showDates = true }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserLookup[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    usersApi.lookup().then(setUsers).catch(() => setUsers([]));
    tagsApi.list({ page: 1, page_size: 100 }).then((data) => setTags(data.items)).catch(() => setTags([]));
  }, []);

  const set = (patch: Partial<RecordFilterValue>) => onChange({ ...value, ...patch });

  return (
    <div className={`grid grid-cols-1 gap-4 ${showDates ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'}`}>
      <Select
        label={t('common.recordedBy')}
        value={value.createdBy}
        onChange={(e) => set({ createdBy: e.target.value })}
        options={users.map((user) => ({ value: user.id, label: user.username }))}
        placeholder={t('common.allPeople')}
        fullWidth
      />
      {showDates && (
        <>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">{t('common.startDate')}</span>
            <input
              type="date"
              value={value.startDate}
              onChange={(e) => set({ startDate: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-gray-700 dark:text-gray-300">{t('common.endDate')}</span>
            <input
              type="date"
              value={value.endDate}
              onChange={(e) => set({ endDate: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </label>
        </>
      )}
      <Select
        label={t('common.tag')}
        value={value.tagId}
        onChange={(e) => set({ tagId: e.target.value })}
        options={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
        placeholder={t('common.allTags')}
        fullWidth
      />
    </div>
  );
};
