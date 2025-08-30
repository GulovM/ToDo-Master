import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';
import { clsx } from 'clsx';

// Class name utility for conditional classes
export const cn = (...classes) => {
  return clsx(classes);
};

// Date formatting utilities
export const dateUtils = {
  // Format date to readable string
  formatDate: (date, formatString = 'MMM dd, yyyy') => {
    if (!date) return '';
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, formatString);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  },

  // Format datetime to readable string
  formatDateTime: (date, formatString = 'MMM dd, yyyy hh:mm a') => {
    if (!date) return '';
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, formatString);
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return '';
    }
  },

  // Format date to relative time (e.g., \"2 hours ago\")
  formatRelativeTime: (date) => {
    if (!date) return '';
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting relative time:', error);
      return '';
    }
  },

  // Check if date is overdue
  isOverdue: (date) => {
    if (!date) return false;
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return isBefore(dateObj, new Date());
    } catch (error) {
      console.error('Error checking if overdue:', error);
      return false;
    }
  },

  // Check if date is in the future
  isFuture: (date) => {
    if (!date) return false;
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return isAfter(dateObj, new Date());
    } catch (error) {
      console.error('Error checking if future:', error);
      return false;
    }
  },

  // Convert date to ISO string for API calls
  toISOString: (date) => {
    if (!date) return null;
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return dateObj.toISOString();
    } catch (error) {
      console.error('Error converting to ISO string:', error);
      return null;
    }
  },

  // Get days until deadline
  getDaysUntilDeadline: (deadline) => {
    if (!deadline) return null;
    try {
      const deadlineDate = typeof deadline === 'string' ? parseISO(deadline) : deadline;
      const now = new Date();
      const diffTime = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error('Error calculating days until deadline:', error);
      return null;
    }
  },
};

// Validation utilities
export const validation = {
  // Email validation
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Password validation
  isValidPassword: (password) => {
    // At least 8 characters
    return password && password.length >= 8;
  },

  // Strong password validation
  isStrongPassword: (password) => {
    // At least 8 characters, one uppercase, one lowercase, one number
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  },

  // Required field validation
  isRequired: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },

  // Minimum length validation
  minLength: (value, min) => {
    return value && value.toString().length >= min;
  },

  // Maximum length validation
  maxLength: (value, max) => {
    return !value || value.toString().length <= max;
  },
};

// Priority utilities
export const priorityUtils = {
  // Get priority color
  getPriorityColor: (priority) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'danger',
    };
    return colors[priority] || 'gray';
  },

  // Get priority badge classes
  getPriorityBadgeClass: (priority) => {
    const classes = {
      low: 'bg-success-100 text-success-800 border-success-200',
      medium: 'bg-warning-100 text-warning-800 border-warning-200',
      high: 'bg-danger-100 text-danger-800 border-danger-200',
    };
    return classes[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  },

  // Get priority display text
  getPriorityText: (priority) => {
    const texts = {
      low: 'Низкий приоритет',
      medium: 'Средний приоритет',
      high: 'Высокий приоритет',
    };
    return texts[priority] || 'Unknown Priority';
  },
};

// Storage utilities
export const storage = {
  // Get item from localStorage
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error getting ${key} from localStorage:`, error);
      return defaultValue;
    }
  },

  // Set item in localStorage
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in localStorage:`, error);
      return false;
    }
  },

  // Remove item from localStorage
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
      return false;
    }
  },

  // Clear all localStorage
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },
};

// Toast notification utilities
export const toast = {
  // Success toast
  success: (message, options = {}) => {
    return {
      type: 'success',
      message,
      duration: options.duration || 4000,
      ...options,
    };
  },

  // Error toast
  error: (message, options = {}) => {
    return {
      type: 'error',
      message,
      duration: options.duration || 6000,
      ...options,
    };
  },

  // Warning toast
  warning: (message, options = {}) => {
    return {
      type: 'warning',
      message,
      duration: options.duration || 5000,
      ...options,
    };
  },

  // Info toast
  info: (message, options = {}) => {
    return {
      type: 'info',
      message,
      duration: options.duration || 4000,
      ...options,
    };
  },
};

// URL utilities
export const urlUtils = {
  // Build query string from object
  buildQueryString: (params) => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    
    return searchParams.toString();
  },

  // Parse query string to object
  parseQueryString: (queryString) => {
    const params = new URLSearchParams(queryString);
    const result = {};
    
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    
    return result;
  },
};

// Text utilities
export const textUtils = {
  // Truncate text
  truncate: (text, maxLength = 100, suffix = '...') => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + suffix;
  },

  // Capitalize first letter
  capitalize: (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  // Convert to title case
  toTitleCase: (text) => {
    if (!text) return '';
    return text.replace(/\\w\\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  // Generate initials from name
  getInitials: (name, maxLength = 2) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, maxLength);
  },
};

// Number utilities
export const numberUtils = {
  // Format number with commas
  formatNumber: (number) => {
    if (typeof number !== 'number') return number;
    return number.toLocaleString();
  },

  // Format percentage
  formatPercentage: (number, decimals = 1) => {
    if (typeof number !== 'number') return number;
    return `${number.toFixed(decimals)}%`;
  },

  // Clamp number between min and max
  clamp: (number, min, max) => {
    return Math.min(Math.max(number, min), max);
  },
};

// Debounce utility
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttle utility
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
