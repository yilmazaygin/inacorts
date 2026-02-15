export const storage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem('access_token');
  },

  setAccessToken: (token: string): void => {
    localStorage.setItem('access_token', token);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem('refresh_token');
  },

  setRefreshToken: (token: string): void => {
    localStorage.setItem('refresh_token', token);
  },

  clearTokens: (): void => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token');
  },
};
