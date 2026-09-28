import apiClient from './client';
import type { PaginatedResponse, PaginationParams } from '@/types/api';
import type { Payment, PaymentCreate } from '@/types/entities';

interface PaymentListParams extends PaginationParams {
  order_id?: number;
  start_date?: string;
  end_date?: string;
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

  exportFile: async (params: { format: 'csv' | 'xlsx'; lang: string; start_date?: string; end_date?: string }): Promise<void> => {
    const { downloadExport } = await import('@/utils/download');
    await downloadExport('/api/v1/payments/export', params, `payments.${params.format === 'xlsx' ? 'xlsx' : 'csv'}`);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/payments/${id}`);
  },
};
