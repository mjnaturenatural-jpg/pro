"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TabOption {
  value: string;
  label: string;
}

interface TabsProps {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export function Tabs({ options, value, onChange, ariaLabel = "Tabs" }: TabsProps) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex flex-wrap justify-center gap-1.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative min-h-[44px] rounded-full px-5 py-2 text-sm font-semibold transition",
              active ? "text-ivory-50" : "text-bark-600 hover:bg-bark-800/5 hover:text-bark-900"
            )}
          >
            {active && (
              <motion.span
                layoutId="tab-pill"
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-caramel-700 to-caramel-600 shadow-md shadow-caramel-700/30"
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
