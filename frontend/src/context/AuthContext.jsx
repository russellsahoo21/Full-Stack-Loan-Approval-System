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

export const isValidEmailDomain = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const domainParts = parts[1].split('.');
  const tld = domainParts[domainParts.length - 1];
  return Boolean(tld && tld.length >= 2);
};

export const AuthProvider = ({ children }) => {
  // Helper to parse JWT payload without external library
  const parseJwt = (jwtToken) => {
    try {
      if (!jwtToken || !jwtToken.includes('.')) return null;
      const base64Url = jwtToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  // Initialize from LocalStorage
  const [token, setToken] = useState(() => localStorage.getItem('bre_token') || 'demo-offline-token');
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem('bre_token');
    const savedUser = localStorage.getItem('bre_user');

    if (savedToken && savedToken.startsWith('mock-token-')) {
      const role = savedToken.replace('mock-token-', '');
      return { name: DEMO_USERS[role]?.name || 'Demo User', role };
    }

    if (savedToken && savedToken !== 'demo-offline-token') {
      const decoded = parseJwt(savedToken);
      if (decoded && decoded.role) {
        return {
          name: decoded.name || (savedUser ? JSON.parse(savedUser)?.name : 'User'),
          email: decoded.email,
          role: decoded.role,
          id: decoded.id
        };
      }
    }

    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {}
    }
    return DEMO_USERS[ROLES.ADMIN];
  });
  const [isLoading, setIsLoading] = useState(false);

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

    if (!credentials.email || !isValidEmailDomain(credentials.email)) {
      setIsLoading(false);
      return { 
        success: false, 
        message: 'Please enter a valid email address with a domain (e.g. gmail.com, outlook.com, nbfc.com).' 
      };
    }

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
      const serverMessage = error.response?.data?.message;
      if (serverMessage) {
        return { success: false, message: serverMessage };
      }
      return { 
        success: false, 
        message: 'Account not found or password incorrect. Please sign up if you do not have an account.' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);

    if (!userData.email || !isValidEmailDomain(userData.email)) {
      setIsLoading(false);
      return { 
        success: false, 
        message: 'Please enter a valid email address with a domain (e.g. gmail.com, outlook.com, nbfc.com).' 
      };
    }

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
