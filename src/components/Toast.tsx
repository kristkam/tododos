import React, { useEffect, useState } from 'react';
import { CheckIcon, CancelIcon, CloseIcon } from './icons';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const duration = toast.duration || 2500; // Reduced from 3000ms to 2500ms
    
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onRemove(toast.id), 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckIcon size={14} />;
      case 'error':
        return <CancelIcon size={14} />;
      case 'info':
        return <span style={{ fontSize: '12px', fontWeight: 'bold' }}>i</span>;
      default:
        return <span style={{ fontSize: '12px', fontWeight: 'bold' }}>i</span>;
    }
  };

  return (
    <div
      className={`toast toast-${toast.type} ${isVisible ? 'toast-visible' : ''} ${isLeaving ? 'toast-leaving' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-message">
        {toast.message}
      </div>
      <button
        onClick={() => {
          setIsLeaving(true);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        className="toast-close"
        aria-label="Close notification"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
};