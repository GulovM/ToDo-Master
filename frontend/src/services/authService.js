import apiClient, { API_ENDPOINTS, setTokens, clearTokens } from './api.js';

export const authService = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.auth.register, userData);
      
      if (response.data.tokens) {
        setTokens(response.data.tokens.access, response.data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return {
        success: true,
        data: response.data,
        user: response.data.user,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Registration failed' },
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.auth.login, credentials);
      
      if (response.data.tokens) {
        setTokens(response.data.tokens.access, response.data.tokens.refresh);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return {
        success: true,
        data: response.data,
        user: response.data.user,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Login failed' },
        message: error.response?.data?.message || 'Login failed',
      };
    }
  },

  // Logout user
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        await apiClient.post(API_ENDPOINTS.auth.logout, {
          refresh_token: refreshToken
        });
      }
      
      clearTokens();
      
      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      // Even if the API call fails, clear local tokens
      clearTokens();
      
      return {
        success: true,
        message: 'Logged out successfully',
      };
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.auth.profile);
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data));
      
      return {
        success: true,
        data: response.data,
        user: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to fetch profile' },
        message: error.response?.data?.message || 'Failed to fetch profile',
      };
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.auth.profile, userData);
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return {
        success: true,
        data: response.data,
        user: response.data.user,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to update profile' },
        message: error.response?.data?.message || 'Failed to update profile',
      };
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.auth.changePassword, passwordData);
      
      return {
        success: true,
        data: response.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to change password' },
        message: error.response?.data?.message || 'Failed to change password',
      };
    }
  },

  // Get user statistics
  getUserStats: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.auth.userStats);
      
      return {
        success: true,
        data: response.data,
        stats: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to fetch user stats' },
        message: error.response?.data?.message || 'Failed to fetch user stats',
      };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  // Refresh user data
  refreshUserData: async () => {
    if (!authService.isAuthenticated()) {
      return { success: false, message: 'Not authenticated' };
    }
    
    return await authService.getProfile();
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.health.auth);
      
      return {
        success: true,
        data: response.data,
        status: response.data.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Auth service unavailable' },
        message: error.response?.data?.message || 'Auth service unavailable',
      };
    }
  },
};

export default authService;