import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AuthContextType, UserProfile } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem('auth') === 'true'
  );
  const [userRole, setUserRole] = useState<'admin' | 'user'>(
    () => (localStorage.getItem('role') as 'admin' | 'user') || 'user'
  );
  const [user, setUser] = useState<UserProfile | null>(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  const login = (role: 'admin' | 'user', userData?: UserProfile) => {
    setIsAuthenticated(true);
    setUserRole(role);
    
    // Create user profile if not provided
    const userProfile: UserProfile = userData || {
      id: Math.random().toString(36).substr(2, 9),
      name: role === 'admin' ? 'Admin User' : 'Guest User',
      email: role === 'admin' ? 'admin@example.com' : 'user@example.com',
      role: role,
      createdAt: new Date().toISOString(),
    };

    setUser(userProfile);
    localStorage.setItem('auth', 'true');
    localStorage.setItem('role', role);
    localStorage.setItem('user', JSON.stringify(userProfile));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('auth');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    isAuthenticated,
    userRole,
    user,
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
