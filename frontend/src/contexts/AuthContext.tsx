import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authApi } from '@/api/auth';
import { storage } from '@/utils/storage';
import type { LoginRequest } from '@/types/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(storage.isAuthenticated());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = () => {
      const authenticated = storage.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authApi.login(credentials);
      storage.setAccessToken(response.access_token);
      storage.setRefreshToken(response.refresh_token);
      setIsAuthenticated(true);
    } catch (error) {
      storage.clearTokens();
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    isAuthenticated,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
