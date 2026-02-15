import apiClient from './client';
import type { PaginatedResponse, PaginationParams } from '@/types/api';
import type { Tag, TagCreate, TagLinkRequest, TagUnlinkRequest } from '@/types/entities';

export const tagsApi = {
  list: async (params?: PaginationParams): Promise<PaginatedResponse<Tag>> => {
    const response = await apiClient.get<PaginatedResponse<Tag>>('/api/v1/tags', { params });
    return response.data;
  },

  create: async (data: TagCreate): Promise<Tag> => {
    const response = await apiClient.post<Tag>('/api/v1/tags', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/tags/${id}`);
  },

  link: async (data: TagLinkRequest): Promise<void> => {
    await apiClient.post('/api/v1/tags/link', data);
  },

  unlink: async (data: TagUnlinkRequest): Promise<void> => {
    await apiClient.post('/api/v1/tags/unlink', data);
  },
};
