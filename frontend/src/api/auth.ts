import apiClient from './client';
import type { LoginRequest, Token, RefreshTokenRequest, TokenRefresh } from '@/types/api';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<Token> => {
    const response = await apiClient.post<Token>('/api/v1/auth/login', credentials);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<TokenRefresh> => {
    const response = await apiClient.post<TokenRefresh>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    } as RefreshTokenRequest);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
