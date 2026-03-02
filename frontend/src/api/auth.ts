import apiClient from './client';
import type { LoginRequest, Token, RefreshTokenRequest, TokenRefresh } from '@/types/api';
import type {
  User,
  ForgotPasswordQuestionsRequest,
  ForgotPasswordQuestionsResponse,
  ForgotPasswordVerifyAnswersRequest,
  ForgotPasswordResetRequest,
  VerifyPasswordRequest,
} from '@/types/entities';

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

  me: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/v1/auth/me');
    return response.data;
  },

  verifyPassword: async (data: VerifyPasswordRequest): Promise<void> => {
    await apiClient.post('/api/v1/auth/verify-password', data);
  },

  getForgotPasswordQuestions: async (data: ForgotPasswordQuestionsRequest): Promise<ForgotPasswordQuestionsResponse> => {
    const response = await apiClient.post<ForgotPasswordQuestionsResponse>('/api/v1/auth/forgot-password/questions', data);
    return response.data;
  },

  verifyForgotPasswordAnswers: async (data: ForgotPasswordVerifyAnswersRequest): Promise<void> => {
    await apiClient.post('/api/v1/auth/forgot-password/verify-answers', data);
  },

  resetPasswordWithSecurityAnswers: async (data: ForgotPasswordResetRequest): Promise<void> => {
    await apiClient.post('/api/v1/auth/forgot-password/reset', data);
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
