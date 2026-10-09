"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
  action?: { label: string; href: string };
}

const ToastContext = createContext<{
  toast: (t: Omit<Toast, "id">) => void;
}>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-lift animate-fadeUp",
              t.type === "success" && "border-leaf-200",
              t.type === "error" && "border-red-200",
              t.type === "info" && "border-sand-200"
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                t.type === "success" && "bg-leaf-100 text-leaf-700",
                t.type === "error" && "bg-red-50 text-red-600",
                t.type === "info" && "bg-sand-50 text-caramel-600"
              )}
            >
              <Check size={14} />
            </span>
            <div className="flex-1 text-sm text-bark-800">{t.message}</div>
            {t.action && (
              <Link
                href={t.action.href}
                className="text-xs font-semibold text-caramel-600 hover:text-caramel-700"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              >
                {t.action.label}
              </Link>
            )}
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-bark-500 hover:text-bark-700"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
