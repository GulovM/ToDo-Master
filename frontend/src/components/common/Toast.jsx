import React, { useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/index.js';

const Toast = ({ 
  type = 'info', 
  message, 
  duration = 4000, 
  onClose,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const typeConfig = {
    success: {
      icon: CheckCircleIcon,
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      iconColor: 'text-success-600',
      textColor: 'text-success-800',
      accentColor: 'border-l-success-500'
    },
    error: {
      icon: XCircleIcon,
      bgColor: 'bg-danger-50',
      borderColor: 'border-danger-200',
      iconColor: 'text-danger-600',
      textColor: 'text-danger-800',
      accentColor: 'border-l-danger-500'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      iconColor: 'text-warning-600',
      textColor: 'text-warning-800',
      accentColor: 'border-l-warning-500'
    },
    info: {
      icon: InformationCircleIcon,
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      iconColor: 'text-primary-600',
      textColor: 'text-primary-800',
      accentColor: 'border-l-primary-500'
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const IconComponent = config.icon;

  const positionClasses = {
    'top-right': 'fixed top-4 right-4 z-50',
    'top-left': 'fixed top-4 left-4 z-50',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50'
  };

  return (
    <div
      className={cn(
        positionClasses[position],
        'max-w-sm w-full transition-all duration-300 ease-in-out',
        isExiting ? 'opacity-0 transform translate-x-full' : 'opacity-100 transform translate-x-0'
      )}
      role="alert"
      aria-live="polite"
    >
      <div
        className={cn(
          'rounded-lg border-l-4 border-r border-t border-b shadow-lg p-4',
          config.bgColor,
          config.borderColor,
          config.accentColor
        )}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <IconComponent className={cn('h-5 w-5', config.iconColor)} />
          </div>
          <div className="ml-3 flex-1">
            <p className={cn('text-sm font-medium', config.textColor)}>
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className={cn(
                'inline-flex rounded-md p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                config.iconColor,
                'hover:bg-black/5 focus:ring-current'
              )}
              aria-label="Close notification"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast Container for managing multiple toasts
export const ToastContainer = ({ toasts = [], onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id || index}
          {...toast}
          onClose={() => onRemove?.(toast.id || index)}
        />
      ))}
    </div>
  );
};

export default Toast;
