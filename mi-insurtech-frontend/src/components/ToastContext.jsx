// src/components/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from '@/components/ui/toast'; // Asegúrate de que esta ruta sea correcta para tu shadcn/ui toast
import { Toaster } from '@/components/ui/toaster'; // Asegúrate de que esta ruta sea correcta para tu shadcn/ui toaster

const ToastContext = createContext(undefined);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastIdCounter = useState(0);

  const addToast = useCallback(({ title, description, variant = 'default', duration = 5000 }) => {
    const id = toastIdCounter.current++;
    setToasts((prevToasts) => [...prevToasts, { id, title, description, variant, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((props) => {
    addToast(props);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Toaster>
        {toasts.map(({ id, title, description, variant, duration }) => (
          <Toast
            key={id}
            variant={variant}
            onOpenChange={(open) => {
              if (!open) removeToast(id);
            }}
            duration={duration}
          >
            <div className="grid gap-1">
              {title && <h3 className="font-semibold">{title}</h3>}
              {description && <p className="text-sm opacity-90">{description}</p>}
            </div>
          </Toast>
        ))}
      </Toaster>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
