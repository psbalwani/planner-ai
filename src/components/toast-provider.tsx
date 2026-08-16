"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface ToastEntry {
  id: number;
  message: string;
}

const ToastContext = createContext<((message: string) => void) | null>(null);

let nextToastId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const showError = useCallback((message: string) => {
    const id = nextToastId++;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={showError}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-700 shadow-card"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): (message: string) => void {
  const showError = useContext(ToastContext);
  if (!showError) throw new Error("useToast must be used within ToastProvider");
  return showError;
}
