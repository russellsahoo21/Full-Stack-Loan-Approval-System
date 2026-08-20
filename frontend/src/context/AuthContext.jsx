import React, { createContext, useContext, useState } from 'react';
import { authApi } from '../services/api';

// Supported System Roles matching Backend Models
export const ROLES = {
  ADMIN: 'POLICY_ADMIN',
  L1: 'CREDIT_OFFICER_L1',
  L2: 'CREDIT_OFFICER_L2',
  APPLICANT: 'APPLICANT',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Policy Admin (Risk Head)',
  [ROLES.L1]: 'Credit Officer L1',
  [ROLES.L2]: 'Credit Officer L2',
  [ROLES.APPLICANT]: 'Applicant / Borrower',
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('bre_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bre_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved user from storage:', e);
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const currentRole = user?.role || null;

  const saveAuthSession = (newToken, newUser) => {
    if (newToken) {
      localStorage.setItem('bre_token', newToken);
      setToken(newToken);
    }
    if (newUser) {
      localStorage.setItem('bre_user', JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      if (response.success && response.token) {
        saveAuthSession(response.token, response.user);
        return { success: true, user: response.user };
      }
      return { 
        success: false, 
        message: response.message || 'Invalid email or password. Please check your credentials.' 
      };
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid credentials or user is not registered.';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(userData);
      if (response.success && response.token) {
        saveAuthSession(response.token, response.user);
        return { success: true, user: response.user };
      }
      return { 
        success: false, 
        message: response.message || 'User already exists with this email address.' 
      };
    } catch (error) {
      const message = error.response?.data?.message || 'User already registered with this email address. Please sign in instead.';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('bre_token');
    localStorage.removeItem('bre_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        currentRole,
        isLoading,
        login,
        register,
        logout,
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
