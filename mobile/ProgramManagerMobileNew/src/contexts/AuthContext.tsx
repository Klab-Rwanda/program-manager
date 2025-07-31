import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export type UserRole = 'super_admin' | 'program_manager' | 'facilitator' | 'trainee' | 'it_support';

export interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

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
      // Use your computer's IP address instead of localhost
      const API_URL = 'http://172.20.10.2:8000'; // Updated to correct IP
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token and user data to AsyncStorage
      await AsyncStorage.setItem('accessToken', data.data.accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
      
      setUser(data.data.user);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setUser(null);
      setIsAuthenticated(false);
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    // Check for existing session on app load
    const checkAuthStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const storedUser = await AsyncStorage.getItem('user');

        if (token && storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to restore auth session:', error);
        await logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
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
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}