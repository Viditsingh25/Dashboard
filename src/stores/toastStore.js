import { create } from 'zustand';

let toastId = 0;

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 4000, action) => {
    const id = ++toastId;
    set((state) => ({ toasts: [...state.toasts, { id, message, type, duration, action }] }));
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
    return id;
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  success: (message, duration, action) => useToastStore.getState().addToast(message, 'success', duration, action),
  error: (message, duration, action) => useToastStore.getState().addToast(message, 'error', duration, action),
  info: (message, duration, action) => useToastStore.getState().addToast(message, 'info', duration, action),
  warning: (message, duration, action) => useToastStore.getState().addToast(message, 'warning', duration, action),
}));
