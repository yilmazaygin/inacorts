import apiClient from './client';
import type { Expense, ExpenseCreate, ExpenseUpdate, ExpenseCategory, ExpenseCategoryCreate, ExpenseCategoryUpdate, ExpenseHistory } from '@/types/entities';
import type { PaginatedResponse } from '@/types/api';

interface ListExpensesParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  order?: string;
  category_id?: number;
  start_date?: string;
  end_date?: string;
}

export const expensesApi = {
  // Expenses
  list: async (params?: ListExpensesParams): Promise<PaginatedResponse<Expense>> => {
    const response = await apiClient.get('/api/v1/expenses', { params });
    return response.data;
  },

  get: async (id: number): Promise<Expense> => {
    const response = await apiClient.get(`/api/v1/expenses/${id}`);
    return response.data;
  },

  create: async (data: ExpenseCreate): Promise<Expense> => {
    const response = await apiClient.post('/api/v1/expenses', data);
    return response.data;
  },

  update: async (id: number, data: ExpenseUpdate): Promise<Expense> => {
    const response = await apiClient.put(`/api/v1/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/expenses/${id}`);
  },

  getHistory: async (id: number): Promise<ExpenseHistory[]> => {
    const response = await apiClient.get(`/api/v1/expenses/${id}/history`);
    return response.data;
  },

  // Expense Categories
  listCategories: async (params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<ExpenseCategory>> => {
    const response = await apiClient.get('/api/v1/expenses/categories/list', { params });
    return response.data;
  },

  getCategory: async (id: number): Promise<ExpenseCategory> => {
    const response = await apiClient.get(`/api/v1/expenses/categories/${id}`);
    return response.data;
  },

  createCategory: async (data: ExpenseCategoryCreate): Promise<ExpenseCategory> => {
    const response = await apiClient.post('/api/v1/expenses/categories', data);
    return response.data;
  },

  updateCategory: async (id: number, data: ExpenseCategoryUpdate): Promise<ExpenseCategory> => {
    const response = await apiClient.put(`/api/v1/expenses/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/expenses/categories/${id}`);
  },
};
