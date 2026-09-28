import apiClient from './client';

export interface DashboardStats {
  total_orders: number;
  total_products: number;
  total_customers: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
}

export interface CategoryAmount {
  category_id: number;
  category_name: string;
  amount: number;
}

export interface OrderInsight {
  order_id: number;
  value: number;
}

export interface FinancialReport {
  revenue: number;
  expenses: number;
  net_profit: number;
  profit_margin: number;
  category_breakdown: CategoryAmount[];
  highest_line_items?: OrderInsight | null;
  highest_volume?: OrderInsight | null;
  highest_quantity?: OrderInsight | null;
}

export type FinancialPeriod = 'last_month' | 'last_year' | 'all_time';

export const reportsApi = {
  dashboard: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/api/v1/reports/dashboard');
    return response.data;
  },

  financials: async (period: FinancialPeriod): Promise<FinancialReport> => {
    const response = await apiClient.get<FinancialReport>('/api/v1/reports/financials', { params: { period } });
    return response.data;
  },
};
