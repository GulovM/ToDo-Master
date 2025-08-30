import { apiClient, API_ENDPOINTS } from './api.js';

export const taskService = {
  // Get all tasks with optional filters
  getTasks: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `${API_ENDPOINTS.tasks.list}?${queryString}` : API_ENDPOINTS.tasks.list;
      
      const response = await apiClient.get(url);
      
      return {
        success: true,
        data: response.data,
        tasks: response.data.results || response.data,
        count: response.data.count || (response.data.results || response.data).length,
        next: response.data.next,
        previous: response.data.previous,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to fetch tasks' },
        message: error.response?.data?.message || 'Failed to fetch tasks',
      };
    }
  },

  // Get single task by ID
  getTask: async (taskId) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.tasks.detail(taskId));
      
      return {
        success: true,
        data: response.data,
        task: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to fetch task' },
        message: error.response?.data?.message || 'Failed to fetch task',
      };
    }
  },

  // Create new task
  createTask: async (taskData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.tasks.list, taskData);
      
      return {
        success: true,
        data: response.data,
        task: response.data.task,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to create task' },
        message: error.response?.data?.message || 'Failed to create task',
      };
    }
  },

  // Update task
  updateTask: async (taskId, taskData) => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.tasks.detail(taskId), taskData);
      
      return {
        success: true,
        data: response.data,
        task: response.data.task,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to update task' },
        message: error.response?.data?.message || 'Failed to update task',
      };
    }
  },

  // Partial update task
  patchTask: async (taskId, taskData) => {
    try {
      const response = await apiClient.patch(API_ENDPOINTS.tasks.detail(taskId), taskData);
      
      return {
        success: true,
        data: response.data,
        task: response.data.task,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to update task' },
        message: error.response?.data?.message || 'Failed to update task',
      };
    }
  },

  // Delete task
  deleteTask: async (taskId) => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.tasks.detail(taskId));
      
      return {
        success: true,
        data: response.data,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to delete task' },
        message: error.response?.data?.message || 'Failed to delete task',
      };
    }
  },

  // Update task status (complete/incomplete)
  updateTaskStatus: async (taskId, isCompleted) => {
    try {
      const response = await apiClient.patch(API_ENDPOINTS.tasks.updateStatus(taskId), {
        is_done: isCompleted
      });
      
      return {
        success: true,
        data: response.data,
        message: response.data.message,
        isCompleted: response.data.is_done,
        completedAt: response.data.completed_at,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to update task status' },
        message: error.response?.data?.message || 'Failed to update task status',
      };
    }
  },

  // Bulk operations on tasks
  bulkUpdateTasks: async (taskIds, action) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.tasks.bulk, {
        task_ids: taskIds,
        action: action // 'complete', 'uncomplete', 'delete'
      });
      
      return {
        success: true,
        data: response.data,
        message: response.data.message,
        affectedCount: response.data.affected_count,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to perform bulk operation' },
        message: error.response?.data?.message || 'Failed to perform bulk operation',
      };
    }
  },

  // Get task statistics
  getTaskStats: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.tasks.stats);
      
      return {
        success: true,
        data: response.data,
        stats: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to fetch task statistics' },
        message: error.response?.data?.message || 'Failed to fetch task statistics',
      };
    }
  },

  // Get upcoming tasks
  getUpcomingTasks: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.tasks.upcoming);
      
      return {
        success: true,
        data: response.data,
        tasks: response.data.tasks,
        count: response.data.count,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to fetch upcoming tasks' },
        message: error.response?.data?.message || 'Failed to fetch upcoming tasks',
      };
    }
  },

  // Advanced search for tasks
  searchTasks: async (searchParams) => {
    try {
      const params = new URLSearchParams();
      
      // Add search parameters
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `${API_ENDPOINTS.tasks.search}?${queryString}` : API_ENDPOINTS.tasks.search;
      
      const response = await apiClient.get(url);
      
      return {
        success: true,
        data: response.data,
        tasks: response.data.tasks,
        count: response.data.count,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to search tasks' },
        message: error.response?.data?.message || 'Failed to search tasks',
      };
    }
  },

  // Get task categories
  getCategories: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.categories.list);
      
      return {
        success: true,
        data: response.data,
        categories: response.data.results || response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to fetch categories' },
        message: error.response?.data?.message || 'Failed to fetch categories',
      };
    }
  },

  // Create new category
  createCategory: async (categoryData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.categories.list, categoryData);
      
      return {
        success: true,
        data: response.data,
        category: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to create category' },
        message: error.response?.data?.message || 'Failed to create category',
      };
    }
  },

  // Update category
  updateCategory: async (categoryId, categoryData) => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.categories.detail(categoryId), categoryData);
      
      return {
        success: true,
        data: response.data,
        category: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to update category' },
        message: error.response?.data?.message || 'Failed to update category',
      };
    }
  },

  // Delete category
  deleteCategory: async (categoryId) => {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.categories.detail(categoryId));
      
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Category deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Failed to delete category' },
        message: error.response?.data?.message || 'Failed to delete category',
      };
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.health.tasks);
      
      return {
        success: true,
        data: response.data,
        status: response.data.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { message: 'Tasks service unavailable' },
        message: error.response?.data?.message || 'Tasks service unavailable',
      };
    }
  },
};

export default taskService;