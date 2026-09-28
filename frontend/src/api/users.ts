import apiClient from './client';
import type { PaginatedResponse, SearchParams } from '@/types/api';
import type {
  User, UserCreate, UserUpdate, UserProfileUpdate,
  SecurityQuestionSetup, SecurityQuestionUpdate, ChangePasswordRequest
} from '@/types/entities';

export interface UserLookup {
  id: number;
  username: string;
}

export const usersApi = {
  lookup: async (): Promise<UserLookup[]> => {
    const response = await apiClient.get<UserLookup[]>('/api/v1/users/lookup');
    return response.data;
  },

  list: async (params?: SearchParams): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get<PaginatedResponse<User>>('/api/v1/users', { params });
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`/api/v1/users/${id}`);
    return response.data;
  },

  create: async (data: UserCreate): Promise<User> => {
    const response = await apiClient.post<User>('/api/v1/users', data);
    return response.data;
  },

  update: async (id: number, data: UserUpdate): Promise<User> => {
    const response = await apiClient.put<User>(`/api/v1/users/${id}`, data);
    return response.data;
  },

  uploadPhoto: async (id: number, file: File): Promise<User> => {
    const form = new FormData();
    form.append('file', file);
    const response = await apiClient.post<User>(`/api/v1/users/${id}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deletePhoto: async (id: number): Promise<User> => {
    const response = await apiClient.delete<User>(`/api/v1/users/${id}/photo`);
    return response.data;
  },

  updateProfile: async (data: UserProfileUpdate): Promise<User> => {
    const response = await apiClient.put<User>('/api/v1/users/me', data);
    return response.data;
  },

  deactivate: async (id: number): Promise<User> => {
    const response = await apiClient.post<User>(`/api/v1/users/${id}/deactivate`);
    return response.data;
  },

  setupSecurityQuestions: async (data: SecurityQuestionSetup): Promise<User> => {
    const response = await apiClient.put<User>('/api/v1/users/me/security-questions', data);
    return response.data;
  },

  updateSecurityQuestions: async (data: SecurityQuestionUpdate): Promise<User> => {
    const response = await apiClient.put<User>('/api/v1/users/me/security-questions-update', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<User> => {
    const response = await apiClient.post<User>('/api/v1/users/me/change-password', data);
    return response.data;
  },
};
