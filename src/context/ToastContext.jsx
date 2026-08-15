import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 md:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded bg-surface-container-high border shadow-2xl transition-all duration-300 transform translate-y-0 animate-fade-in ${
              toast.type === 'error'
                ? 'border-error/40 text-on-surface'
                : toast.type === 'success'
                ? 'border-primary/40 text-on-surface'
                : 'border-outline-variant/30 text-on-surface'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-[20px] ${
                toast.type === 'error' ? 'text-error' : toast.type === 'success' ? 'text-primary' : 'text-on-surface-variant'
              }`}>
                {toast.type === 'error' ? 'error' : toast.type === 'success' ? 'check_circle' : 'info'}
              </span>
              <p className="font-body text-sm font-medium tracking-wide">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-on-surface-variant hover:text-on-surface ml-3 p-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
