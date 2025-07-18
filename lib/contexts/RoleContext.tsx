'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
}

interface RoleContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, you'd validate the token with the backend
      // For now, we'll simulate a logged-in user
      setUser({
        id: '1',
        email: 'demo@example.com',
        name: 'Demo User',
        role: 'manager'
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // In a real app, you'd make an API call here
      // For demo purposes, we'll simulate a successful login
      const mockUser: User = {
        id: '1',
        email,
        name: 'Demo User',
        role: 'manager'
      };
      
      setUser(mockUser);
      localStorage.setItem('token', 'mock-token');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      // In a real app, you'd make an API call here
      // For demo purposes, we'll simulate a successful registration
      const mockUser: User = {
        id: '1',
        email,
        name,
        role: 'user'
      };
      
      setUser(mockUser);
      localStorage.setItem('token', 'mock-token');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const value: RoleContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
} 