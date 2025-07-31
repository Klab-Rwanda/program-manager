import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Login - Same API as web app
export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', data);
  const { user, token } = response.data.data;
  
  // Store token and user data
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  
  return { user, token };
};

// Logout - Clear stored data
export const logout = async (): Promise<void> => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
};

// Get current user from storage
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  } catch (error) {
    return false;
  }
};

// Get stored token
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    return null;
  }
}; 