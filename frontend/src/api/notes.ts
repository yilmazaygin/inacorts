import apiClient from './client';
import type { PaginatedResponse, PaginationParams } from '@/types/api';
import type { Note, NoteCreate } from '@/types/entities';
import type { EntityType } from '@/types/enums';

interface NoteListParams extends PaginationParams {
  entity_type?: EntityType;
  entity_id?: number;
}

export const notesApi = {
  list: async (params?: NoteListParams): Promise<PaginatedResponse<Note>> => {
    const response = await apiClient.get<PaginatedResponse<Note>>('/api/v1/notes', { params });
    return response.data;
  },

  create: async (data: NoteCreate): Promise<Note> => {
    const response = await apiClient.post<Note>('/api/v1/notes', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/notes/${id}`);
  },
};
