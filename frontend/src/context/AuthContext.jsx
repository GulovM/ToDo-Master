import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/authService.js';
import { toast } from '../utils/index.js';

// Create Auth Context
const AuthContext = createContext();

// Auth state initial values
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };
    
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    
    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          
          if (currentUser) {
            // Try to refresh user data
            const response = await authService.refreshUserData();
            
            if (response.success) {
              dispatch({
                type: 'AUTH_SUCCESS',
                payload: { user: response.user },
              });
            } else {
              // If refresh fails, use cached user data
              dispatch({
                type: 'AUTH_SUCCESS',
                payload: { user: currentUser },
              });
            }
          } else {
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } else {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        dispatch({ type: 'AUTH_LOGOUT' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authService.login(credentials);
      
      if (response.success) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.user },
        });
        
        return {
          success: true,
          message: response.message,
        };
      } else {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: { error: response.error },
        });
        
        return {
          success: false,
          error: response.error,
          message: response.message,
        };
      }
    } catch (error) {
      const errorMessage = 'Login failed. Please try again.';
      
      dispatch({
        type: 'AUTH_FAILURE',
        payload: { error: { message: errorMessage } },
      });
      
      return {
        success: false,
        error: { message: errorMessage },
        message: errorMessage,
      };
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authService.register(userData);
      
      if (response.success) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.user },
        });
        
        return {
          success: true,
          message: response.message,
        };
      } else {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: { error: response.error },
        });
        
        return {
          success: false,
          error: response.error,
          message: response.message,
        };
      }
    } catch (error) {
      const errorMessage = 'Registration failed. Please try again.';
      
      dispatch({
        type: 'AUTH_FAILURE',
        payload: { error: { message: errorMessage } },
      });
      
      return {
        success: false,
        error: { message: errorMessage },
        message: errorMessage,
      };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authService.logout();
      dispatch({ type: 'AUTH_LOGOUT' });
      
      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      // Even if logout API fails, clear local state
      dispatch({ type: 'AUTH_LOGOUT' });
      
      return {
        success: true,
        message: 'Logged out successfully',
      };
    }
  }, []);

  // Google login
  const loginWithGoogle = useCallback(async (idToken) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await authService.loginWithGoogle(idToken);
      if (response.success) {
        dispatch({ type: 'AUTH_SUCCESS', payload: { user: response.user } });
        return { success: true };
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: { error: response.error } });
        return { success: false, error: response.error };
      }
    } catch (e) {
      dispatch({ type: 'AUTH_FAILURE', payload: { error: { message: 'Google login failed' } } });
      return { success: false, error: { message: 'Google login failed' } };
    }
  }, []);

  // Delete account
  const deleteAccount = useCallback(async () => {
    try {
      const res = await authService.deleteAccount();
      dispatch({ type: 'AUTH_LOGOUT' });
      return res;
    } catch (e) {
      dispatch({ type: 'AUTH_LOGOUT' });
      return { success: true };
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (userData) => {
    try {
      const response = await authService.updateProfile(userData);
      
      if (response.success) {
        dispatch({
          type: 'UPDATE_USER',
          payload: response.user,
        });
        
        return {
          success: true,
          message: response.message,
        };
      } else {
        return {
          success: false,
          error: response.error,
          message: response.message,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to update profile' },
        message: 'Failed to update profile',
      };
    }
  }, []);

  // Change password function
  const changePassword = useCallback(async (passwordData) => {
    try {
      const response = await authService.changePassword(passwordData);
      
      return {
        success: response.success,
        message: response.message,
        error: response.error,
      };
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to change password' },
        message: 'Failed to change password',
      };
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.refreshUserData();
      
      if (response.success) {
        dispatch({
          type: 'UPDATE_USER',
          payload: response.user,
        });
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to refresh user data' },
      };
    }
  }, []);

  // Context value
  const value = useMemo(() => ({
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    loginWithGoogle,
    deleteAccount,
    updateProfile,
    changePassword,
    clearError,
    refreshUser,
  }), [state.user, state.isAuthenticated, state.isLoading, state.error, login, register, logout, loginWithGoogle, deleteAccount, updateProfile, changePassword, clearError, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
