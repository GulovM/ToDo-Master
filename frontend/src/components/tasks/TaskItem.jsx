import React, { useState } from 'react';
import {
  CheckIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { useTasks } from '../../context/TaskContext.jsx';
import { cn, dateUtils, priorityUtils, textUtils } from '../../utils/index.js';

const TaskItem = ({ task, viewMode, onEdit, showToast, selectionMode = false, showCategory = true }) => {
  const {
    toggleTaskCompletion,
    deleteTask,
    selectedTasks,
    toggleTaskSelection,
  } = useTasks();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSelected = selectedTasks.includes(task.id);

  // Handle task completion toggle
  const handleToggleCompletion = async () => {
    setIsUpdating(true);
    
    try {
      const result = await toggleTaskCompletion(task.id, !task.is_done);
      
      if (result.success) {
        showToast({
          type: 'success',
          message: result.message,
        });
      } else {
        showToast({
          type: 'error',
          message: result.error?.message || 'Не удалось обновить задачу',
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Произошла ошибка при обновлении задачи',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle task deletion
  const handleDelete = async () => {
    if (!confirm('Удалить эту задачу?')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const result = await deleteTask(task.id);
      
      if (result.success) {
        showToast({
          type: 'success',
          message: result.message,
        });
      } else {
        showToast({
          type: 'error',
          message: result.error?.message || 'Не удалось удалить задачу',
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Произошла ошибка при удалении задачи',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Get priority badge class
  const getPriorityClass = () => {
    return priorityUtils.getPriorityBadgeClass(task.priority);
  };

  // Get deadline status
  const getDeadlineStatus = () => {
    if (!task.deadline) return null;
    
    if (task.is_overdue && !task.is_done) {
      return {
        text: 'Просрочено',
        class: 'text-red-600 bg-red-50',
        icon: ExclamationTriangleIcon,
      };
    }
    
    const daysUntil = dateUtils.getDaysUntilDeadline(task.deadline);
    if (daysUntil !== null) {
      if (daysUntil <= 1 && !task.is_done) {
        return {
          text: daysUntil === 0 ? 'Срок сегодня' : 'Срок завтра',
          class: 'text-orange-600 bg-orange-50',
          icon: ClockIcon,
        };
      } else if (daysUntil <= 7 && !task.is_done) {
        return {
          text: `Срок через ${daysUntil} дн.`,
          class: 'text-blue-600 bg-blue-50',
          icon: ClockIcon,
        };
      }
    }
    
    return {
      text: dateUtils.formatDate(task.deadline),
      class: 'text-gray-600 bg-gray-50',
      icon: ClockIcon,
    };
  };

  const deadlineStatus = getDeadlineStatus();

  if (viewMode === 'grid') {
    return (
      <div
        className={cn(
          "task-card relative",
          task.is_done && "task-completed",
          task.priority === 'high' && "priority-high",
          task.priority === 'medium' && "priority-medium",
          task.priority === 'low' && "priority-low",
          isSelected && "ring-2 ring-primary-500 ring-offset-2"
        )}
      >
        {/* Selection Checkbox */}
        {selectionMode && (
          <div className="absolute top-3 left-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleTaskSelection(task.id)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>
        )}

        {/* Completion Button */}
        <div className="absolute top-3 right-3">
          <button
            onClick={handleToggleCompletion}
            disabled={isUpdating}
            className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
              task.is_done
                ? "bg-green-500 border-green-500 text-white"
                : "border-gray-300 hover:border-green-500 hover:bg-green-50"
            )}
          >
            {task.is_done ? (
              <CheckIconSolid className="w-4 h-4" />
            ) : (
              isUpdating && <div className="loading-spinner" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="mt-8">
          <h3 className={cn(
            "text-lg font-medium mb-2",
            task.is_done ? "line-through text-gray-500" : "text-gray-900"
          )}>
            {task.title}
          </h3>
          
          {task.description && (
            <p className={cn(
              "text-sm mb-3",
              task.is_done ? "text-gray-400" : "text-gray-600"
            )}>
              {textUtils.truncate(task.description, 100)}
            </p>
          )}

          {/* Category and Priority */}
          <div className="flex items-center space-x-2 mb-3">
            {task.category_name && showCategory && (
              <span className="category-badge" style={{ backgroundColor: task.category_color + '20', color: task.category_color }}>
                {task.category_name}
              </span>
            )}
            <span className={cn("category-badge border", getPriorityClass())}>
              {priorityUtils.getPriorityText(task.priority)}
            </span>
          </div>

          {/* Deadline */}
          {deadlineStatus && (
            <div className={cn("flex items-center text-xs px-2 py-1 rounded-full mb-3", deadlineStatus.class)}>
              <deadlineStatus.icon className="w-3 h-3 mr-1" />
              {deadlineStatus.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {dateUtils.formatRelativeTime(task.created_at)}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={onEdit}
                className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                title="Редактировать задачу"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Удалить задачу"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div
      className={cn(
        "task-card flex items-center space-x-4",
        task.is_done && "task-completed",
        task.priority === 'high' && "priority-high",
        task.priority === 'medium' && "priority-medium",
        task.priority === 'low' && "priority-low",
        isSelected && "ring-2 ring-primary-500 ring-offset-2"
      )}
    >
      {/* Selection Checkbox (only in selection mode) */}
      {selectionMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleTaskSelection(task.id)}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
      )}

      {/* Completion Button */}
      <button
        onClick={handleToggleCompletion}
        disabled={isUpdating}
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0",
          task.is_done
            ? "bg-green-500 border-green-500 text-white"
            : "border-gray-300 hover:border-green-500 hover:bg-green-50"
        )}
      >
        {task.is_done ? (
          <CheckIconSolid className="w-4 h-4" />
        ) : (
          isUpdating && <div className="loading-spinner" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "text-lg font-medium mb-1",
              task.is_done ? "line-through text-gray-500" : "text-gray-900"
            )}>
              {task.title}
            </h3>
            
            {task.description && (
              <p className={cn(
                "text-sm mb-2",
                task.is_done ? "text-gray-400" : "text-gray-600"
              )}>
                {textUtils.truncate(task.description, 150)}
              </p>
            )}

            {/* Category, Priority, and Deadline */}
            <div className="flex items-center space-x-3">
              {task.category_name && showCategory && (
                <span className="category-badge" style={{ backgroundColor: task.category_color + '20', color: task.category_color }}>
                  {task.category_name}
                </span>
              )}
              <span className={cn("category-badge border", getPriorityClass())}>
                {priorityUtils.getPriorityText(task.priority)}
              </span>
              {deadlineStatus && (
                <div className={cn("flex items-center text-xs px-2 py-1 rounded-full", deadlineStatus.class)}>
                  <deadlineStatus.icon className="w-3 h-3 mr-1" />
                  {deadlineStatus.text}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            <span className="text-xs text-gray-500">
              {dateUtils.formatRelativeTime(task.created_at)}
            </span>
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
              title="Редактировать задачу"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="Удалить задачу"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
