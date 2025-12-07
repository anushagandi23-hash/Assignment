import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('auth') === 'true'
  );
  const [userRole, setUserRole] = useState<'admin' | 'user'>(
    () => (localStorage.getItem('role') as 'admin' | 'user') || 'user'
  );

  const login = (role: 'admin' | 'user') => {
    setIsAuthenticated(true);
    setUserRole(role);
    localStorage.setItem('auth', 'true');
    localStorage.setItem('role', role);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth');
    localStorage.removeItem('role');
  };

  const value: AuthContextType = {
    isAuthenticated,
    userRole,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
