import axios from 'axios';

// Get the backend URL from environment variables, with a fallback for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    // Check if localStorage is available (for server-side rendering)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access, e.g., redirect to login
      if (typeof window !== 'undefined') {
        console.error("Unauthorized request. Logging out.");
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;