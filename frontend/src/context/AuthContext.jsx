import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const DEMO_USERS = {
  [ROLES.ADMIN]: {
    name: 'Policy Admin',
    email: 'admin@nbfc.com',
    password: 'admin123',
    role: ROLES.ADMIN,
  },
  [ROLES.L1]: {
    name: 'Credit Officer L1',
    email: 'officer1@nbfc.com',
    password: 'officer123',
    role: ROLES.L1,
  },
  [ROLES.L2]: {
    name: 'Credit Officer L2',
    email: 'officer2@nbfc.com',
    password: 'officer123',
    role: ROLES.L2,
  },
  [ROLES.APPLICANT]: {
    name: 'Rahul Sharma',
    email: 'rahul@gmail.com',
    password: 'rahul123',
    role: ROLES.APPLICANT,
  },
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize from LocalStorage or default demo token
  const [token, setToken] = useState(() => localStorage.getItem('bre_token') || 'demo-offline-token');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bre_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved user from storage:', e);
      }
    }
    return DEMO_USERS[ROLES.ADMIN];
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('bre_token')) {
      localStorage.setItem('bre_token', 'demo-offline-token');
    }
    if (!localStorage.getItem('bre_user')) {
      localStorage.setItem('bre_user', JSON.stringify(DEMO_USERS[ROLES.ADMIN]));
    }
  }, []);

  const currentRole = user?.role || ROLES.ADMIN;

  // Sync token and user in localStorage
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
      // Fallback for offline testing
      const message = error.response?.data?.message || 'Backend connection issue. Logging in with demo credentials.';
      const fallbackUser = {
        name: credentials.email ? credentials.email.split('@')[0] : 'Demo User',
        email: credentials.email || 'admin@nbfc.com',
        role: ROLES.ADMIN,
      };
      saveAuthSession('demo-offline-token', fallbackUser);
      return { success: true, user: fallbackUser, fallback: true, message };
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
    setToken('demo-offline-token');
    setUser(DEMO_USERS[ROLES.ADMIN]);
  };

  // Instant Persona Switcher for Hackathon Live Demo
  const switchRole = async (targetRole) => {
    const demo = DEMO_USERS[targetRole];
    if (!demo) return;

    try {
      const response = await authApi.login({ email: demo.email, password: demo.password });
      if (response.success && response.token) {
        saveAuthSession(response.token, response.user);
        return;
      }
    } catch (err) {
      // Fallback if demo users not seeded in DB
    }
    
    // Fallback: set mock credentials
    saveAuthSession(`mock-token-${targetRole}`, {
      name: demo.name,
      email: demo.email,
      role: targetRole,
    });
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
        switchRole,
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
