"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  labelledBy?: string;
}

export function Drawer({ open, onClose, title, children, labelledBy }: DrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-brown-900/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={labelledBy || title}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ivory-50 shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-bark-800/10 px-5 py-4">
              <h2 className="font-serif text-lg text-bark-900">{title}</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close panel"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-bark-800/5 text-bark-700 transition hover:bg-bark-800/10"
              >
                <X size={18} />
              </button>
            </div>
            <div className={cn("flex-1 overflow-y-auto")}>{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
