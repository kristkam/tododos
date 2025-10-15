import { createContext } from 'react';
import type { ToastData } from '../components/Toast';

export interface ToastContextType {
  showToast: (message: string, type?: ToastData['type'], duration?: number) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);