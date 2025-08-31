import axios from 'axios';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Token management
const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/token/refresh/`,
            { refresh: refreshToken }
          );

          const { access } = response.data;
          setTokens(access, refreshToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token is invalid, clear all tokens and redirect to login
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    register: '/auth/register/',
    login: '/auth/login/',
    logout: '/auth/logout/',
    profile: '/auth/profile/',
    deleteAccount: '/auth/delete-account/',
    changePassword: '/auth/change-password/',
    userStats: '/auth/stats/',
    token: '/auth/token/',
    tokenRefresh: '/auth/token/refresh/',
    google: '/auth/google/',
  },
  
  // Tasks
  tasks: {
    list: '/tasks/',
    detail: (id) => `/tasks/${id}/`,
    updateStatus: (id) => `/tasks/${id}/status/`,
    bulk: '/tasks/bulk/',
    stats: '/tasks/stats/',
    upcoming: '/tasks/upcoming/',
    search: '/tasks/search/',
    aiAssist: '/tasks/ai/assist/',
  },
  
  // Categories
  categories: {
    list: '/tasks/categories/',
    detail: (id) => `/tasks/categories/${id}/`,
  },
  
  // Health checks
  health: {
    auth: '/auth/health/',
    tasks: '/tasks/health/',
  },
};

// Export utilities
export {
  apiClient,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  API_BASE_URL,
};

export default apiClient;
