import React, { createContext, useContext, useState } from 'react';

// Roles: RM (Relationship Manager), L1 (Credit Approver), L2 (Credit Head), Admin (Risk Manager)
export const ROLES = {
  RM: 'RM',
  L1: 'L1',
  L2: 'L2',
  ADMIN: 'Admin',
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Mock initial state: logged in as RM
  const [currentRole, setCurrentRole] = useState(ROLES.RM);
  const [user, setUser] = useState({ name: 'Alex Doe (Mock)', id: 'U-1001' });

  const switchRole = (role) => {
    setCurrentRole(role);
    setUser({ name: `${role} User (Mock)`, id: `U-${Math.floor(Math.random() * 1000)}` });
  };

  const login = (userData) => {
    setUser({ ...userData, id: `U-${Math.floor(Math.random() * 1000)}` });
    setCurrentRole(ROLES.RM); // Default role on login
  };

  return (
    <AuthContext.Provider value={{ currentRole, user, switchRole, login }}>
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
