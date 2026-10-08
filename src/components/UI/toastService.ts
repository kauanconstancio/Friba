export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

export type ToastListener = (toast: ToastItem) => void;
export const toastListeners = new Set<ToastListener>();

export const showToast = (
  message: string,
  type: ToastType = 'info',
  duration: number = 4000
) => {
  const toast: ToastItem = {
    id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    message,
    type,
    duration,
  };
  toastListeners.forEach(fn => fn(toast));
};
