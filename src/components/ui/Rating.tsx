import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}

export function Rating({ value, count, size = 14, className }: RatingProps) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="flex gap-0.5" role="img" aria-label={`Rated ${value} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={i < rounded ? "fill-turmeric-400 text-turmeric-400" : "text-bark-300"}
            aria-hidden="true"
          />
        ))}
      </span>
      {typeof count === "number" && (
        <span className="text-xs text-bark-500">
          {value.toFixed(1)} ({count})
        </span>
      )}
    </span>
  );
}
