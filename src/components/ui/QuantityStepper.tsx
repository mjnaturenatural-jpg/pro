"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  small?: boolean;
  onRemoveAtMin?: () => void;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 50,
  small = false,
  onRemoveAtMin,
}: QuantityStepperProps) {
  const clamp = (n: number) => onChange(Math.max(min, Math.min(max, n)));
  const removeEnabled = Boolean(onRemoveAtMin) && value <= min;
  const btn = cn(
    "flex items-center justify-center text-bark-600 transition hover:text-caramel-700 disabled:opacity-40",
    small ? "h-9 w-9" : "h-11 min-w-[44px] px-3"
  );
  return (
    <div className="inline-flex items-center rounded-full border border-bark-800/15 bg-ivory-100">
      <button
        type="button"
        onClick={() => (removeEnabled ? onRemoveAtMin!() : clamp(value - 1))}
        disabled={value <= min && !removeEnabled}
        className={btn}
        aria-label={removeEnabled ? "Remove item" : "Decrease quantity"}
      >
        <Minus size={15} />
      </button>
      <span className={cn("text-center text-sm font-bold", small ? "min-w-[28px]" : "min-w-[40px]")} aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={() => clamp(value + 1)} disabled={value >= max} className={btn} aria-label="Increase quantity">
        <Plus size={15} />
      </button>
    </div>
  );
}
