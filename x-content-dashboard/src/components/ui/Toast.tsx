'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

const typeStyles: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: '#dcfce7',
    border: '#22c55e',
    icon: '✓',
  },
  error: {
    bg: '#fee2e2',
    border: '#ef4444',
    icon: '✕',
  },
  warning: {
    bg: '#fef3c7',
    border: '#f59e0b',
    icon: '⚠',
  },
  info: {
    bg: '#dbeafe',
    border: '#3b82f6',
    icon: 'ⓘ',
  },
};

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '400px',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const style = typeStyles[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}
      onClick={() => onRemove(toast.id)}
    >
      <span
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: style.border,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {style.icon}
      </span>
      <span
        style={{
          fontSize: '0.875rem',
          color: '#1f2937',
          fontWeight: 500,
        }}
      >
        {toast.message}
      </span>
    </motion.div>
  );
}
