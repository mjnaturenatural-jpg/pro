import { cn } from "@/lib/utils";

/** Organic wave divider between sections. `fill` paints the section below. */
export function WaveDivider({ fill = "#FDFAF5", flip = false, className }: { fill?: string; flip?: boolean; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("block w-full leading-[0]", flip && "rotate-180", className)}>
      <svg viewBox="0 0 1440 64" preserveAspectRatio="none" className="h-8 w-full sm:h-12">
        <path
          d="M0,40 C240,70 420,10 720,26 C1020,42 1200,60 1440,30 L1440,64 L0,64 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}

/** Small hand-drawn style leaf sprig accent. */
export function LeafSprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={cn("h-8 w-8", className)}>
      <path d="M24 42C24 28 24 16 24 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 30C16 30 10 24 9 15c9 1 15 7 15 15Z" fill="currentColor" opacity="0.85" />
      <path d="M24 22c8 0 14-6 15-15-9 1-15 7-15 15Z" fill="currentColor" opacity="0.6" />
      <path d="M24 38c-5 0-9-3-10-8 5 1 9 4 10 8Z" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

/** Jaggery-block motif — stacked rounded cubes. */
export function JaggeryMotif({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden="true" className={cn("h-8 w-8", className)}>
      <rect x="8" y="24" width="14" height="14" rx="3" fill="currentColor" opacity="0.85" />
      <rect x="26" y="24" width="14" height="14" rx="3" fill="currentColor" opacity="0.6" />
      <rect x="17" y="10" width="14" height="14" rx="3" fill="currentColor" />
    </svg>
  );
}
