// src/lib/contexts/RoleContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types'; // Import your new User type
import api from '@/lib/api'; // Import the configured api client

// Make sure your UserRole type covers all roles from the backend
export type UserRole = 'super_admin' | 'program_manager' | 'facilitator' | 'trainee' | 'it_support';

export interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
   setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // Add loading state

   const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
      setHasMounted(true);
  }, []);
  const normalizeRole = (role: string): UserRole => {
      // Convert backend role names to frontend format
      const roleMap: Record<string, UserRole> = {
        'SuperAdmin': 'super_admin',
        'Program Manager': 'program_manager',
        'Facilitator': 'facilitator',
        'Trainee': 'trainee',

        'ItSupport': 'it_support'


      };
      return roleMap[role] || role as UserRole;
  };

const login = async (email: string, password: string) => {
  try {
    const res = await api.post('/auth/login', {
      email,
      password,
    });

    const { accessToken, user } = res.data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    setIsAuthenticated(true);
  } catch (err: any) {
    console.error('Login error:', err);
    throw new Error(err?.response?.data?.message || 'Login failed');
  }
};


  const logout = (): void => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    // This effect runs once on app load to check for an existing session
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
        logout(); // Clear invalid data
      }
    }
    setLoading(false); // Finished checking auth status
  }, []);

  const value: AuthContextType = {
    user,
    role: user ? normalizeRole(user.role) : null,
    isAuthenticated,
    loading,
    login,
    logout,
      setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a RoleProvider');
  }
  return context;
}