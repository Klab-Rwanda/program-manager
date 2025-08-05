// src/lib/api.ts (or wherever your axios instance is configured)
import axios from 'axios';

// Ensure this URL is correct for your backend API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for sending cookies, though we prioritize Authorization header
});

// Request Interceptor: Attach token before sending request
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken'); 

    // If token exists, set the Authorization header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      // console.log('🔑 Token being sent:', token.substring(0, 20) + '...'); // For debugging
    } else {
      // console.log('❌ No token found in localStorage for this request.'); // For debugging
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle token expiration/invalidation
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('🚨 API Error Response:', error.response?.status, error.response?.data);
    // Check for 401 Unauthorized or specific JWT expired message
    if (error.response?.status === 401 ||
        (error.response?.data?.message && error.response.data.message.includes('jwt expired')) ||
        (error.response?.data?.message && error.response.data.message.includes('Unauthorized request'))) {
      
      // Prevent infinite redirect loops if already on login page
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
        console.warn('Authentication expired or unauthorized. Clearing token and redirecting to login.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        // Force a full page reload to clear all React state and contexts
        window.location.href = '/auth/login'; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;