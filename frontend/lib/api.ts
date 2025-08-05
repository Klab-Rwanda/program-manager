import axios from 'axios';

let API_BASE_URL = 'http://localhost:8000/api/v1'; // Fallback (local dev)

// Step 1: Use env var if available (for build-time injection in Vercel, Andasy, etc.)
if (process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL) {
  API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL!;
}
// Step 2: Fallback to dynamic hostname-based detection (if env is not present)
else if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  if (hostname.includes('andasy')) {
    API_BASE_URL = 'https://klabbackend.andasy.dev/api/v1';
  } else if (hostname.includes('vercel')) {
    API_BASE_URL = 'https://program-manager-klab.onrender.com/api/v1';
  }
}

// Create and export the axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;
