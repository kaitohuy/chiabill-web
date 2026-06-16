import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface UserResponse {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  bankQrUrl: string | null;
  bankId: string | null;
  accountNo: string | null;
  role: 'USER' | 'ADMIN';
  isAnonymous: boolean;
  isGhost: boolean;
}

interface AuthResponse {
  token?: string;
  user: UserResponse;
}

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginGoogle: (idToken: string) => Promise<void>;
  loginAnonymous: () => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserResponse>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load user profile on startup if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const response = await api.get('/api/users/me');
          if (response.data && response.data.success) {
            setUser(response.data.data);
          } else {
            // Invalid session
            logout();
          }
        } catch (error) {
          console.error('Failed to load user profile on start:', error);
          // Don't log out immediately on network error, only on 401 (handled by Axios interceptor)
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [token]);

  const loginGoogle = async (idToken: string) => {
    try {
      setIsLoading(true);
      // If we are currently an anonymous user, pass current user ID to link accounts
      const response = await api.post('/api/auth/google', {
        idToken,
      });

      if (response.data && response.data.success) {
        const authData: AuthResponse = response.data.data;
        if (authData.token) {
          localStorage.setItem('auth_token', authData.token);
          setToken(authData.token);
        }
        setUser(authData.user);
        localStorage.setItem('user_info', JSON.stringify(authData.user));
      } else {
        throw new Error(response.data.message || 'Google Login failed');
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAnonymous = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/api/auth/anonymous');
      if (response.data && response.data.success) {
        const authData: AuthResponse = response.data.data;
        if (authData.token) {
          localStorage.setItem('auth_token', authData.token);
          setToken(authData.token);
        }
        setUser(authData.user);
        localStorage.setItem('user_info', JSON.stringify(authData.user));
      } else {
        throw new Error(response.data.message || 'Anonymous Login failed');
      }
    } catch (error) {
      console.error('Anonymous login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    setToken(null);
    setUser(null);
  };

  const updateProfile = (updatedUser: Partial<UserResponse>) => {
    setUser(prev => {
      if (!prev) return null;
      const newUser = { ...prev, ...updatedUser };
      localStorage.setItem('user_info', JSON.stringify(newUser));
      return newUser;
    });
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const response = await api.get('/api/users/me');
      if (response.data && response.data.success) {
        setUser(response.data.data);
        localStorage.setItem('user_info', JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        loginGoogle,
        loginAnonymous,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
