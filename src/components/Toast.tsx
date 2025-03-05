import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div
        className={`rounded-lg shadow-lg p-4 flex items-center space-x-2 ${
          type === 'success' ? 'bg-green-50' : 'bg-red-50'
        }`}
      >
        {type === 'success' ? (
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
        ) : (
          <XCircleIcon className="h-5 w-5 text-red-500" />
        )}
        <p
          className={`text-sm ${
            type === 'success' ? 'text-green-700' : 'text-red-700'
          }`}
        >
          {message}
        </p>
        <button
          onClick={onClose}
          className={`ml-2 text-sm font-medium ${
            type === 'success'
              ? 'text-green-700 hover:text-green-900'
              : 'text-red-700 hover:text-red-900'
          }`}
        >
          Close
        </button>
      </div>
    </div>
  );
}; 