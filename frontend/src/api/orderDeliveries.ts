import apiClient from './client';
import type { OrderDelivery, OrderDeliveryCreate } from '@/types/entities';

export const orderDeliveriesApi = {
  list: async (orderId: number): Promise<OrderDelivery[]> => {
    const response = await apiClient.get(`/api/v1/orders/${orderId}/deliveries`);
    return response.data;
  },

  create: async (orderId: number, data: OrderDeliveryCreate): Promise<OrderDelivery> => {
    const response = await apiClient.post(`/api/v1/orders/${orderId}/deliveries`, data);
    return response.data;
  },
};
