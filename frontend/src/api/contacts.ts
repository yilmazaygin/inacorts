import apiClient from './client';
import type { PaginatedResponse, SearchParams } from '@/types/api';
import type { Contact, ContactCreate, ContactUpdate } from '@/types/entities';

export const contactsApi = {
  list: async (params?: SearchParams): Promise<PaginatedResponse<Contact>> => {
    const response = await apiClient.get<PaginatedResponse<Contact>>('/api/v1/contacts', { params });
    return response.data;
  },

  get: async (id: number): Promise<Contact> => {
    const response = await apiClient.get<Contact>(`/api/v1/contacts/${id}`);
    return response.data;
  },

  create: async (data: ContactCreate): Promise<Contact> => {
    const response = await apiClient.post<Contact>('/api/v1/contacts', data);
    return response.data;
  },

  update: async (id: number, data: ContactUpdate): Promise<Contact> => {
    const response = await apiClient.put<Contact>(`/api/v1/contacts/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/contacts/${id}`);
  },
};
