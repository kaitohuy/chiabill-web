import axios from 'axios';

// Get API base URL from env variables, fallback to localhost:8080
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors (e.g. 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    // Return the response data directly (Spring Boot ApiResponse wrapper)
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      // If unauthorized, clear token and trigger redirect or state reset
      if (status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        
        // Only redirect to login if we are not already on an auth page
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
