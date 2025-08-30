import { useCallback } from 'react';
import { useTasks } from '../context/TaskContext.jsx';

// Custom hook for task operations with simplified API
export const useTaskOperations = () => {
  const {
    tasks,
    categories,
    stats,
    isLoading,
    isCreating,
    isUpdating,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    bulkUpdateTasks,
    loadTasks,
    clearError,
  } = useTasks();

  // Create task with error handling
  const handleCreateTask = useCallback(async (taskData) => {
    try {
      const result = await createTask(taskData);
      return result;
    } catch (error) {
      console.error('Error creating task:', error);
      return {
        success: false,
        error: { message: 'Failed to create task' },
      };
    }
  }, [createTask]);

  // Update task with error handling
  const handleUpdateTask = useCallback(async (taskId, taskData) => {
    try {
      const result = await updateTask(taskId, taskData);
      return result;
    } catch (error) {
      console.error('Error updating task:', error);
      return {
        success: false,
        error: { message: 'Failed to update task' },
      };
    }
  }, [updateTask]);

  // Delete task with confirmation
  const handleDeleteTask = useCallback(async (taskId, skipConfirmation = false) => {
    if (!skipConfirmation && !window.confirm('Are you sure you want to delete this task?')) {
      return { success: false, cancelled: true };
    }

    try {
      const result = await deleteTask(taskId);
      return result;
    } catch (error) {
      console.error('Error deleting task:', error);
      return {
        success: false,
        error: { message: 'Failed to delete task' },
      };
    }
  }, [deleteTask]);

  // Toggle task completion
  const handleToggleTask = useCallback(async (taskId, isCompleted) => {
    try {
      const result = await toggleTaskCompletion(taskId, isCompleted);
      return result;
    } catch (error) {
      console.error('Error toggling task:', error);
      return {
        success: false,
        error: { message: 'Failed to update task status' },
      };
    }
  }, [toggleTaskCompletion]);

  // Bulk complete tasks
  const handleCompleteMultiple = useCallback(async (taskIds) => {
    try {
      const result = await bulkUpdateTasks(taskIds, 'complete');
      return result;
    } catch (error) {
      console.error('Error completing tasks:', error);
      return {
        success: false,
        error: { message: 'Failed to complete tasks' },
      };
    }
  }, [bulkUpdateTasks]);

  // Bulk delete tasks
  const handleDeleteMultiple = useCallback(async (taskIds, skipConfirmation = false) => {
    if (!skipConfirmation && !window.confirm(`Are you sure you want to delete ${taskIds.length} tasks?`)) {
      return { success: false, cancelled: true };
    }

    try {
      const result = await bulkUpdateTasks(taskIds, 'delete');
      return result;
    } catch (error) {
      console.error('Error deleting tasks:', error);
      return {
        success: false,
        error: { message: 'Failed to delete tasks' },
      };
    }
  }, [bulkUpdateTasks]);

  // Refresh tasks
  const refreshTasks = useCallback(async () => {
    try {
      await loadTasks();
      return { success: true };
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      return {
        success: false,
        error: { message: 'Failed to refresh tasks' },
      };
    }
  }, [loadTasks]);

  return {
    // Data
    tasks,
    categories,
    stats,
    
    // State
    isLoading,
    isCreating,
    isUpdating,
    error,
    
    // Operations
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    toggleTask: handleToggleTask,
    completeMultiple: handleCompleteMultiple,
    deleteMultiple: handleDeleteMultiple,
    refreshTasks,
    clearError,
  };
};

export default useTaskOperations;