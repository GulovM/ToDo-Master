import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import taskService from '../services/taskService.js';
import { useAuth } from './AuthContext.jsx';

// Create Task Context
const TaskContext = createContext();

// Task state initial values
const initialState = {
  tasks: [],
  categories: [],
  currentTask: null,
  filters: {
    search: '',
    category: '',
    priority: '',
    is_done: null,
    is_overdue: false,
  },
  stats: {
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    overdue_tasks: 0,
    completion_rate: 0,
  },
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  error: null,
  selectedTasks: [],
};

// Task reducer
const taskReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_CREATING':
      return {
        ...state,
        isCreating: action.payload,
      };
    
    case 'SET_UPDATING':
      return {
        ...state,
        isUpdating: action.payload,
      };
    
    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload,
        isLoading: false,
        error: null,
      };
    
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
        isCreating: false,
        error: null,
      };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.id ? action.payload : task
        ),
        currentTask: action.payload,
        isUpdating: false,
        error: null,
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
        selectedTasks: state.selectedTasks.filter(id => id !== action.payload),
        error: null,
      };
    
    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
        error: null,
      };
    
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
        error: null,
      };
    
    case 'SET_CURRENT_TASK':
      return {
        ...state,
        currentTask: action.payload,
      };
    
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };
    
    case 'SET_STATS':
      return {
        ...state,
        stats: action.payload,
      };
    
    case 'SET_SELECTED_TASKS':
      return {
        ...state,
        selectedTasks: action.payload,
      };
    
    case 'TOGGLE_TASK_SELECTION':
      const taskId = action.payload;
      const isSelected = state.selectedTasks.includes(taskId);
      return {
        ...state,
        selectedTasks: isSelected
          ? state.selectedTasks.filter(id => id !== taskId)
          : [...state.selectedTasks, taskId],
      };
    
    case 'SELECT_ALL_TASKS':
      return {
        ...state,
        selectedTasks: action.payload ? state.tasks.map(task => task.id) : [],
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isCreating: false,
        isUpdating: false,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
};

// Task Provider Component
export const TaskProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const { isAuthenticated } = useAuth();

  // (moved effect to bottom, after callbacks are defined)

  // Load tasks with current filters
  const loadTasks = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await taskService.getTasks(state.filters);
      
      if (response.success) {
        dispatch({ type: 'SET_TASKS', payload: response.tasks });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { message: 'Failed to load tasks' } });
    }
  }, [state.filters]);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const response = await taskService.getCategories();
      
      if (response.success) {
        dispatch({ type: 'SET_CATEGORIES', payload: response.categories });
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  // Create category
  const createCategory = async (categoryData) => {
    try {
      const response = await taskService.createCategory(categoryData);
      if (response.success) {
        dispatch({ type: 'ADD_CATEGORY', payload: response.category });
        return { success: true };
      }
      return { success: false, error: response.error, message: response.message };
    } catch (error) {
      return { success: false, error: { message: 'Failed to create category' } };
    }
  };

  // Update category
  const updateCategory = async (categoryId, categoryData) => {
    try {
      const response = await taskService.updateCategory(categoryId, categoryData);
      if (response.success) {
        // Reload categories to reflect changes
        await loadCategories();
        return { success: true };
      }
      return { success: false, error: response.error, message: response.message };
    } catch (error) {
      return { success: false, error: { message: 'Failed to update category' } };
    }
  };

  // Delete category
  const deleteCategoryById = async (categoryId) => {
    try {
      const response = await taskService.deleteCategory(categoryId);
      if (response.success) {
        // Optimistically remove from state
        dispatch({
          type: 'SET_CATEGORIES',
          payload: state.categories.filter((c) => c.id !== categoryId),
        });
        return { success: true, message: response.message };
      }
      return { success: false, error: response.error, message: response.message };
    } catch (error) {
      return { success: false, error: { message: 'Failed to delete category' } };
    }
  };

  // Load task statistics
  const loadStats = useCallback(async () => {
    try {
      const response = await taskService.getTaskStats();
      
      if (response.success) {
        dispatch({ type: 'SET_STATS', payload: response.stats });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  // Create new task
  const createTask = async (taskData) => {
    try {
      dispatch({ type: 'SET_CREATING', payload: true });
      
      const response = await taskService.createTask(taskData);
      
      if (response.success) {
        dispatch({ type: 'ADD_TASK', payload: response.task });
        await loadStats(); // Refresh stats
        return { success: true, message: response.message };
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return { success: false, error: response.error, message: response.message };
      }
    } catch (error) {
      const errorMessage = 'Failed to create task';
      dispatch({ type: 'SET_ERROR', payload: { message: errorMessage } });
      return { success: false, error: { message: errorMessage } };
    } finally {
      dispatch({ type: 'SET_CREATING', payload: false });
    }
  };

  // Update task
  const updateTask = async (taskId, taskData) => {
    try {
      dispatch({ type: 'SET_UPDATING', payload: true });
      
      const response = await taskService.updateTask(taskId, taskData);
      
      if (response.success) {
        dispatch({ type: 'UPDATE_TASK', payload: response.task });
        await loadStats(); // Refresh stats
        return { success: true, message: response.message };
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return { success: false, error: response.error, message: response.message };
      }
    } catch (error) {
      const errorMessage = 'Failed to update task';
      dispatch({ type: 'SET_ERROR', payload: { message: errorMessage } });
      return { success: false, error: { message: errorMessage } };
    } finally {
      dispatch({ type: 'SET_UPDATING', payload: false });
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      const response = await taskService.deleteTask(taskId);
      
      if (response.success) {
        dispatch({ type: 'DELETE_TASK', payload: taskId });
        await loadStats(); // Refresh stats
        return { success: true, message: response.message };
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return { success: false, error: response.error, message: response.message };
      }
    } catch (error) {
      const errorMessage = 'Failed to delete task';
      dispatch({ type: 'SET_ERROR', payload: { message: errorMessage } });
      return { success: false, error: { message: errorMessage } };
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = async (taskId, isCompleted) => {
    try {
      const response = await taskService.updateTaskStatus(taskId, isCompleted);
      
      if (response.success) {
        // Find and update the task
        const updatedTask = state.tasks.find(task => task.id === taskId);
        if (updatedTask) {
          const updated = {
            ...updatedTask,
            is_done: isCompleted,
            completed_at: response.completedAt,
          };
          dispatch({ type: 'UPDATE_TASK', payload: updated });
        }
        await loadStats(); // Refresh stats
        return { success: true, message: response.message };
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = 'Failed to update task status';
      dispatch({ type: 'SET_ERROR', payload: { message: errorMessage } });
      return { success: false, error: { message: errorMessage } };
    }
  };

  // Bulk operations
  const bulkUpdateTasks = async (taskIds, action) => {
    try {
      const response = await taskService.bulkUpdateTasks(taskIds, action);
      
      if (response.success) {
        // Reload tasks to get updated data
        await loadTasks();
        await loadStats();
        return { success: true, message: response.message };
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = 'Failed to perform bulk operation';
      dispatch({ type: 'SET_ERROR', payload: { message: errorMessage } });
      return { success: false, error: { message: errorMessage } };
    }
  };

  // Set filters and reload tasks
  const setFilters = useCallback(async (newFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: newFilters });
    // Reload tasks with new filters
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await taskService.getTasks({ ...state.filters, ...newFilters });
      if (response.success) {
        dispatch({ type: 'SET_TASKS', payload: response.tasks });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { message: 'Failed to filter tasks' } });
    }
  }, [state.filters]);

  // Search tasks
  const searchTasks = async (searchParams) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await taskService.searchTasks(searchParams);
      
      if (response.success) {
        dispatch({ type: 'SET_TASKS', payload: response.tasks });
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { message: 'Failed to search tasks' } });
    }
  };

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Load tasks and categories when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
      loadCategories();
      loadStats();
    }
  }, [isAuthenticated, loadTasks, loadCategories, loadStats]);

  // Context value
  const value = {
    // State
    tasks: state.tasks,
    categories: state.categories,
    currentTask: state.currentTask,
    filters: state.filters,
    stats: state.stats,
    isLoading: state.isLoading,
    isCreating: state.isCreating,
    isUpdating: state.isUpdating,
    error: state.error,
    selectedTasks: state.selectedTasks,
    
    // Actions
    loadTasks,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory: deleteCategoryById,
    loadStats,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    bulkUpdateTasks,
    setFilters,
    searchTasks,
    clearError,
    
    // Selection actions
    setSelectedTasks: (taskIds) => dispatch({ type: 'SET_SELECTED_TASKS', payload: taskIds }),
    toggleTaskSelection: (taskId) => dispatch({ type: 'TOGGLE_TASK_SELECTION', payload: taskId }),
    selectAllTasks: (selectAll) => dispatch({ type: 'SELECT_ALL_TASKS', payload: selectAll }),
    setCurrentTask: (task) => dispatch({ type: 'SET_CURRENT_TASK', payload: task }),
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

// Custom hook to use task context
export const useTasks = () => {
  const context = useContext(TaskContext);
  
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  
  return context;
};

export default TaskContext;
