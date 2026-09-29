import React, { useState, useEffect } from 'react';
import type { User, LoginRequest, RegisterRequest } from '../types/auth.types';
import { loginApi, registerApi, getMeApi } from '../api/auth.api';
import { AuthContext, type AuthContextType } from './auth.context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    return !!localStorage.getItem('accessToken');
  });

  // Restore authenticated session on initial mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    let isMounted = true;
    getMeApi()
      .then((response) => {
        if (isMounted) {
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sign in
  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const res = await loginApi(data);
      if (res.success && res.data) {
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        setUser(res.data.user);
      } else {
        throw new Error(res.message || 'Sign in failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const res = await registerApi(data);
      if (res.success && res.data) {
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        setUser(res.data.user);
      } else {
        throw new Error(res.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
