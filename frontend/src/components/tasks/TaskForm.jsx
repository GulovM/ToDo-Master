import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTasks } from '../../context/TaskContext.jsx';
import { validation, cn, dateUtils } from '../../utils/index.js';
import LoadingSpinner from '../common/LoadingSpinner.jsx';

const TaskForm = ({ task, onClose, onSuccess }) => {
  const { categories, createTask, updateTask, isCreating, isUpdating } = useTasks();
  
  const isEditing = !!task;
  const isSubmitting = isCreating || isUpdating;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    deadline: '',
  });
  
  const [formErrors, setFormErrors] = useState({});

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        category: task.category || '',
        deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: '',
        deadline: '',
      });
    }
  }, [task]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    // Title validation
    if (!validation.isRequired(formData.title)) {
      errors.title = 'Введите название задачи';
    } else if (!validation.minLength(formData.title, 3)) {
      errors.title = 'Название должно быть не короче 3 символов';
    } else if (!validation.maxLength(formData.title, 200)) {
      errors.title = 'Название должно быть короче 200 символов';
    }

    // Description validation
    if (formData.description && !validation.maxLength(formData.description, 1000)) {
      errors.description = 'Описание должно быть короче 1000 символов';
    }

    // Deadline validation
    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      if (deadlineDate <= new Date()) {
        errors.deadline = 'Дедлайн должен быть в будущем';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare data for API
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        category: formData.category ? parseInt(formData.category) : null,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      };
      
      let result;
      
      if (isEditing) {
        result = await updateTask(task.id, taskData);
      } else {
        result = await createTask(taskData);
      }
      
      if (result.success) {
        onSuccess(result.message || `Task ${isEditing ? 'updated' : 'created'} successfully`);
      } else {
        // Set field-specific errors if available
        if (result.error && typeof result.error === 'object') {
          const apiErrors = {};
          Object.keys(result.error).forEach(key => {
            if (Array.isArray(result.error[key])) {
              apiErrors[key] = result.error[key][0];
            } else {
              apiErrors[key] = result.error[key];
            }
          });
          setFormErrors(apiErrors);
        }
      }
    } catch (error) {
      console.error('Task form error:', error);
      setFormErrors({
        general: 'Произошла непредвиденная ошибка. Попробуйте ещё раз.',
      });
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditing ? 'Редактировать задачу' : 'Создать задачу'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Error */}
            {formErrors.general && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{formErrors.general}</div>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Название *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className={cn(
                    "block w-full rounded-lg border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm",
                    formErrors.title
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  )}
                  placeholder="Введите название задачи"
                  disabled={isSubmitting}
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Описание
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className={cn(
                    "block w-full rounded-lg border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm",
                    formErrors.description
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  )}
                  placeholder="Введите описание (необязательно)"
                  disabled={isSubmitting}
                />
                {formErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>
                )}
              </div>
            </div>

            {/* Priority and Category */}
            <div className="grid grid-cols-2 gap-4">
              {/* Приоритет */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                  Приоритет
                </label>
                <div className="mt-1">
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                    disabled={isSubmitting}
                  >
                    <option value="low">Низкий приоритет</option>
                    <option value="medium">Средний приоритет</option>
                    <option value="high">Высокий приоритет</option>
                  </select>
                </div>
              </div>

              {/* Категория */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Категория
                </label>
                <div className="mt-1">
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                    disabled={isSubmitting}
                  >
                    <option value="">Без категории</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

              {/* Дедлайн */}
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                Дедлайн
              </label>
              <div className="mt-1">
                <input
                  type="datetime-local"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className={cn(
                    "block w-full rounded-lg border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm",
                    formErrors.deadline
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  )}
                  disabled={isSubmitting}
                />
                {formErrors.deadline && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.deadline}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn-outline"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "btn-primary",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {isEditing ? 'Обновление...' : 'Создание...'}
                  </>
                ) : (
                  isEditing ? 'Обновить задачу' : 'Создать задачу'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;
