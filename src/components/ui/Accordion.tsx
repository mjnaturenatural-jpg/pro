"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  title: string;
  body: React.ReactNode;
}

export function Accordion({ items, className }: { items: AccordionItem[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();
  return (
    <div className={cn("divide-y divide-bark-800/10 border-y border-bark-800/10", className)}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.title} className="py-4">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`${baseId}-panel-${i}`}
              id={`${baseId}-button-${i}`}
              className="flex w-full cursor-pointer items-center justify-between gap-3 text-left text-sm font-semibold text-bark-800"
            >
              {item.title}
              <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bark-800/5 text-bark-600 transition-transform duration-300", isOpen && "rotate-45 bg-caramel-100 text-caramel-700")}>
                <Plus size={15} />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`${baseId}-panel-${i}`}
                  role="region"
                  aria-labelledby={`${baseId}-button-${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 text-sm leading-relaxed text-bark-600">{item.body}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
