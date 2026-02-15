import apiClient from './client';
import type { PaginatedResponse, PaginationParams } from '@/types/api';
import type { Category, CategoryCreate, CategoryUpdate } from '@/types/entities';

export const categoriesApi = {
  list: async (params?: PaginationParams): Promise<PaginatedResponse<Category>> => {
    const response = await apiClient.get<PaginatedResponse<Category>>('/api/v1/categories', { params });
    return response.data;
  },

  get: async (id: number): Promise<Category> => {
    const response = await apiClient.get<Category>(`/api/v1/categories/${id}`);
    return response.data;
  },

  create: async (data: CategoryCreate): Promise<Category> => {
    const response = await apiClient.post<Category>('/api/v1/categories', data);
    return response.data;
  },

  update: async (id: number, data: CategoryUpdate): Promise<Category> => {
    const response = await apiClient.put<Category>(`/api/v1/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/categories/${id}`);
  },
};
