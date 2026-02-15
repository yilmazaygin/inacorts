import apiClient from './client';
import type { PaginatedResponse, SearchParams } from '@/types/api';
import type { Product, ProductCreate, ProductUpdate } from '@/types/entities';

interface ProductListParams extends SearchParams {
  category_id?: number;
}

export const productsApi = {
  list: async (params?: ProductListParams): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>('/api/v1/products', { params });
    return response.data;
  },

  get: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/api/v1/products/${id}`);
    return response.data;
  },

  create: async (data: ProductCreate): Promise<Product> => {
    const response = await apiClient.post<Product>('/api/v1/products', data);
    return response.data;
  },

  update: async (id: number, data: ProductUpdate): Promise<Product> => {
    const response = await apiClient.put<Product>(`/api/v1/products/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/products/${id}`);
  },
};
