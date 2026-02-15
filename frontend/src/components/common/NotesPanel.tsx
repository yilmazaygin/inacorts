import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from './Card';
import { Button } from './Button';
import { TextArea } from './TextArea';
import { LoadingSpinner } from './LoadingSpinner';
import { notesApi } from '@/api/notes';
import { formatDate, getErrorMessage } from '@/utils/format';
import type { Note, NoteCreate } from '@/types/entities';
import { EntityType } from '@/types/enums';

interface NotesPanelProps {
  entityType: EntityType;
  entityId: number;
  title?: string;
}

/**
 * NotesPanel - Reusable component for displaying and creating notes
 * Shows WHO created each note and WHEN
 * Used for Products, Orders, Customers
 */
export const NotesPanel: React.FC<NotesPanelProps> = ({ 
  entityType, 
  entityId,
  title 
}) => {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotes();
  }, [entityType, entityId]);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await notesApi.list({ 
        entity_type: entityType, 
        entity_id: entityId,
        page_size: 100 
      });
      setNotes(data.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) {
      alert(t('validation.required'));
      return;
    }

    try {
      setIsAdding(true);
      const noteData: NoteCreate = {
        entity_type: entityType,
        entity_id: entityId,
        text: newNoteText.trim(),
      };
      await notesApi.create(noteData);
      setNewNoteText('');
      setShowAddForm(false);
      await loadNotes();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to add note'));
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm(t('common.confirm') + '?')) return;

    try {
      await notesApi.delete(noteId);
      await loadNotes();
    } catch (err: any) {
      alert(getErrorMessage(err, 'Failed to delete note'));
    }
  };

  return (
    <Card title={title || t('common.notes')}>
      <div className="space-y-4">
        {/* Add Note Button */}
        {!showAddForm && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            + {t('common.addNote')}
          </Button>
        )}

        {/* Add Note Form */}
        {showAddForm && (
          <form onSubmit={handleAddNote} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
            <TextArea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder={t('common.typeNote')}
              rows={3}
              disabled={isAdding}
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isAdding}
              >
                {isAdding ? t('common.saving') : t('common.save')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false);
                  setNewNoteText('');
                }}
                disabled={isAdding}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        )}

        {/* Notes List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : error ? (
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        ) : notes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-6">
            {t('common.noNotes')}
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                      {note.text}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title={t('common.delete')}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">{note.created_by_username || 'Unknown'}</span>
                  </div>
                  <span>•</span>
                  <span>{formatDate(note.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
