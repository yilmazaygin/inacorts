import apiClient from './client';
import type { PaginatedResponse, PaginationParams } from '@/types/api';
import type { Order, OrderCreate, OrderUpdate, DeliverOrderItemRequest } from '@/types/entities';
import type { OrderStatus, PaymentStatus, DeliveryStatus } from '@/types/enums';

interface OrderListParams extends PaginationParams {
  customer_id?: number;
  order_status?: OrderStatus;
  payment_status?: PaymentStatus;
  delivery_status?: DeliveryStatus;
  start_date?: string;
  end_date?: string;
}

export const ordersApi = {
  list: async (params?: OrderListParams): Promise<PaginatedResponse<Order>> => {
    const response = await apiClient.get<PaginatedResponse<Order>>('/api/v1/orders', { params });
    return response.data;
  },

  get: async (id: number): Promise<Order> => {
    const response = await apiClient.get<Order>(`/api/v1/orders/${id}`);
    return response.data;
  },

  create: async (data: OrderCreate): Promise<Order> => {
    const response = await apiClient.post<Order>('/api/v1/orders', data);
    return response.data;
  },

  update: async (id: number, data: OrderUpdate): Promise<Order> => {
    const response = await apiClient.put<Order>(`/api/v1/orders/${id}`, data);
    return response.data;
  },

  cancel: async (id: number): Promise<Order> => {
    const response = await apiClient.post<Order>(`/api/v1/orders/${id}/cancel`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/orders/${id}`);
  },

  deliverItem: async (itemId: number, data: DeliverOrderItemRequest): Promise<Order> => {
    const response = await apiClient.post<Order>(`/api/v1/order-items/${itemId}/deliver`, data);
    return response.data;
  },
};
