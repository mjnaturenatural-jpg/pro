"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function AnnouncementBar({ adminText = "" }: { adminText?: string }) {
  const messages = [
    ...(adminText ? [adminText] : []),
    `Free shipping on all orders`,
    "100% Eggless \u2022 No Maida \u2022 No Refined Sugar",
    "Made fresh in small batches",
    "Festive gifting hampers available",
  ];
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("mj-ann-dismissed") === "1") setDismissed(true);
    } catch {
      // storage unavailable — keep the bar visible
    }
  }, []);

  useEffect(() => {
    if (dismissed || paused || messages.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % messages.length), 4000);
    return () => clearInterval(t);
  }, [dismissed, paused, messages.length]);

  if (dismissed) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem("mj-ann-dismissed", "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  return (
    <div
      className="bg-gradient-to-r from-caramel-700 via-caramel-600 to-caramel-700 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container-site relative flex min-h-9 items-center justify-center py-1.5 text-center">
        <p aria-live="polite" className="px-8 text-[11px] font-bold uppercase tracking-[0.12em] sm:text-xs">
          <AnimatePresence mode="wait">
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="block"
            >
              {messages[index]}
            </motion.span>
          </AnimatePresence>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
