import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authApi } from '@/api/auth';
import { storage } from '@/utils/storage';
import type { LoginRequest } from '@/types/api';
import type { User } from '@/types/entities';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(storage.isAuthenticated());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    try {
      const userData = await authApi.me();
      setUser(userData);
    } catch {
      // If fetching user fails, token might be invalid
      storage.clearTokens();
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = storage.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        await fetchUser();
      }
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
      await fetchUser();
    } catch (error) {
      storage.clearTokens();
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const refreshUser = async () => {
    if (isAuthenticated) {
      await fetchUser();
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    isLoading,
    refreshUser,
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
