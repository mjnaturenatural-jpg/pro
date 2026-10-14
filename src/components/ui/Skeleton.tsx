import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-xl bg-bark-800/10", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[32px] border border-bark-800/10 bg-ivory-100">
      <Skeleton className="aspect-[4/5] rounded-none" />
      <div className="space-y-2.5 p-5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-9 w-full !rounded-full" />
        <Skeleton className="h-9 w-full !rounded-full" />
      </div>
    </div>
  );
}
