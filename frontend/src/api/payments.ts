import apiClient from './client';
import type { PaginatedResponse, PaginationParams } from '@/types/api';
import type { Payment, PaymentCreate } from '@/types/entities';

interface PaymentListParams extends PaginationParams {
  order_id?: number;
}

export const paymentsApi = {
  list: async (params?: PaymentListParams): Promise<PaginatedResponse<Payment>> => {
    const response = await apiClient.get<PaginatedResponse<Payment>>('/api/v1/payments', { params });
    return response.data;
  },

  create: async (data: PaymentCreate): Promise<Payment> => {
    const response = await apiClient.post<Payment>('/api/v1/payments', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/payments/${id}`);
  },
};
