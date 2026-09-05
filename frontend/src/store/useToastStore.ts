import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (newToast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...newToast, id }],
    }));

    const duration = newToast.duration ?? 3500;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}));

// Helper functions for easy import and call: toast.success('...')
export const toast = {
  success: (message: string, description?: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'success', message, description, duration });
  },
  error: (message: string, description?: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'error', message, description, duration });
  },
  info: (message: string, description?: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'info', message, description, duration });
  },
  warning: (message: string, description?: string, duration?: number) => {
    useToastStore.getState().addToast({ type: 'warning', message, description, duration });
  },
};
