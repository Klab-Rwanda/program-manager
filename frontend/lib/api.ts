// src/lib/api.ts
import axios from 'axios';

// Get the API URL from environment variables
// Create a .env.local file in your frontend's root directory
// and add: NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies if you use them
});

// Interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    // We'll get the token from localStorage where the AuthContext will save it
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;