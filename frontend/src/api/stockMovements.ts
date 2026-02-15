import apiClient from './client';
import type { PaginatedResponse, PaginationParams } from '@/types/api';
import type { StockMovement, StockMovementCreate } from '@/types/entities';

interface StockMovementListParams extends PaginationParams {
  product_id?: number;
}

export const stockMovementsApi = {
  list: async (params?: StockMovementListParams): Promise<PaginatedResponse<StockMovement>> => {
    const response = await apiClient.get<PaginatedResponse<StockMovement>>('/api/v1/stock-movements', { params });
    return response.data;
  },

  create: async (data: StockMovementCreate): Promise<StockMovement> => {
    const response = await apiClient.post<StockMovement>('/api/v1/stock-movements', data);
    return response.data;
  },
};
