// src/lib/contexts/RoleContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types/user';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react'; // For a better loading experience

export interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const normalizeRole = (role: string): UserRole => {
      return role as UserRole;
  };

  const login = async (email: string, password: string): Promise<void> => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data && response.data.success) {
      const { user: loggedInUser, accessToken } = response.data.data;
      
      setUser(loggedInUser);
      setIsAuthenticated(true);
      
      // This is safe because login() is only called from a client-side action
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
    } else {
      throw new Error(response.data.message || 'Login failed');
    }
  };

  const logout = (): void => {
    setUser(null);
    setIsAuthenticated(false);
    // This is safe because logout() is only called from a client-side action
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    // Redirect to login page after logout to ensure clean state
    window.location.href = '/auth/login';
  };

  // THE FIX IS HERE
  useEffect(() => {
    // This effect runs only on the client-side, after the initial server render.
    // This is where it's safe to access browser-only APIs like localStorage.
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
  }, []); // Empty array ensures this runs only once on mount

  const value: AuthContextType = {
    user,
    role: user ? normalizeRole(user.role) : null,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Show a global loader while we check for auth status */}
      {loading ? (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      ) : (
          children
      )}
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