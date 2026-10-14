"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "whatsapp" | "gold";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-caramel-700 to-caramel-600 text-white shadow-lg shadow-caramel-700/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-caramel-700/40",
  secondary:
    "border border-caramel-700/40 bg-white text-caramel-700 shadow-sm hover:-translate-y-0.5 hover:border-caramel-700/70 hover:bg-caramel-50 hover:shadow-md",
  ghost: "text-bark-700 hover:bg-bark-800/5 hover:text-bark-900",
  whatsapp: "bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 hover:-translate-y-0.5 hover:bg-[#1EBE5A]",
  gold: "bg-gradient-to-r from-turmeric-500 to-turmeric-400 text-brown-900 shadow-lg shadow-turmeric-500/30 hover:-translate-y-0.5 hover:shadow-xl",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-7 py-3.5 text-base",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading = false, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-0 active:scale-[0.98]",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
