import apiClient from './client';
import type { PaginatedResponse, SearchParams } from '@/types/api';
import type { Customer, CustomerCreate, CustomerUpdate } from '@/types/entities';

export const customersApi = {
  list: async (params?: SearchParams): Promise<PaginatedResponse<Customer>> => {
    const response = await apiClient.get<PaginatedResponse<Customer>>('/api/v1/customers', { params });
    return response.data;
  },

  get: async (id: number): Promise<Customer> => {
    const response = await apiClient.get<Customer>(`/api/v1/customers/${id}`);
    return response.data;
  },

  create: async (data: CustomerCreate): Promise<Customer> => {
    const response = await apiClient.post<Customer>('/api/v1/customers', data);
    return response.data;
  },

  update: async (id: number, data: CustomerUpdate): Promise<Customer> => {
    const response = await apiClient.put<Customer>(`/api/v1/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/customers/${id}`);
  },
};
