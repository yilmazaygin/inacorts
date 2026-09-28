import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tagsApi } from '@/api/tags';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { getErrorMessage } from '@/utils/format';
import type { Tag } from '@/types/entities';
import type { TagEntityType } from '@/types/enums';

interface TagEditorProps {
  entityType: TagEntityType;
  entityId: number;
}

export const TagEditor: React.FC<TagEditorProps> = ({ entityType, entityId }) => {
  const { t } = useTranslation();
  const [linked, setLinked] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [current, catalog] = await Promise.all([
      tagsApi.links(entityType, entityId),
      tagsApi.list({ page: 1, page_size: 100 }),
    ]);
    setLinked(current);
    setAllTags(catalog.items);
  };

  useEffect(() => {
    load().catch(() => setLinked([]));
  }, [entityType, entityId]);

  const link = async (tagId: number) => {
    await tagsApi.link({ tag_id: tagId, entity_type: entityType, entity_id: entityId });
    await load();
  };

  const addExisting = async () => {
    if (!selectedId) return;
    setError('');
    try {
      await link(Number(selectedId));
      setSelectedId('');
    } catch (err) {
      setError(getErrorMessage(err, t('errors.saveFailed')));
    }
  };

  const createAndLink = async () => {
    const name = newName.trim();
    if (!name) return;
    setError('');
    try {
      const existing = allTags.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
      const tag = existing ?? await tagsApi.create({ name });
      await link(tag.id);
      setNewName('');
    } catch (err) {
      setError(getErrorMessage(err, t('errors.saveFailed')));
    }
  };

  const remove = async (tagId: number) => {
    setError('');
    try {
      await tagsApi.unlink({ tag_id: tagId, entity_type: entityType, entity_id: entityId });
      await load();
    } catch (err) {
      setError(getErrorMessage(err, t('errors.saveFailed')));
    }
  };

  const available = allTags.filter((tag) => !linked.some((item) => item.id === tag.id));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {linked.length === 0 && <span className="text-sm text-gray-500 dark:text-gray-400">{t('common.noTags')}</span>}
        {linked.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => remove(tag.id)}
            className="rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
            title={t('common.remove')}
          >
            {tag.name} ×
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          options={available.map((tag) => ({ value: tag.id, label: tag.name }))}
          placeholder={t('common.tag')}
          fullWidth
        />
        <Button type="button" variant="secondary" onClick={addExisting} disabled={!selectedId}>
          {t('common.addTag')}
        </Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('common.newTag')}
          fullWidth
        />
        <Button type="button" variant="secondary" onClick={createAndLink} disabled={!newName.trim()}>
          {t('common.addTag')}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};
