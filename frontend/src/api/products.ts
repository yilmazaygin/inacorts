import apiClient from './client';
import type { PaginatedResponse, SearchParams } from '@/types/api';
import type { Product, ProductCreate, ProductUpdate } from '@/types/entities';

interface ProductListParams extends SearchParams {
  category_id?: number;
  created_by?: number;
  start_date?: string;
  end_date?: string;
  tag_id?: number;
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

  bulkPrice: async (productIds: number[], mode: 'percent' | 'amount', value: number): Promise<{ updated: number }> => {
    const response = await apiClient.post<{ updated: number }>('/api/v1/products/bulk-price', {
      product_ids: productIds,
      mode,
      value,
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/products/${id}`);
  },

  uploadImage: async (id: number, file: File): Promise<Product> => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post<Product>(`/api/v1/products/${id}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteImage: async (id: number, filename?: string): Promise<Product> => {
    const response = await apiClient.delete<Product>(`/api/v1/products/${id}/image`, {
      params: filename ? { filename } : undefined,
    });
    return response.data;
  },

  saveImages: async (id: number, files: File[], removedUrls: string[]): Promise<void> => {
    for (const url of removedUrls) {
      const filename = decodeURIComponent(url.split('?')[0].split('/').pop() || '');
      if (filename) await productsApi.deleteImage(id, filename);
    }
    for (const file of files) {
      await productsApi.uploadImage(id, file);
    }
  },
};
