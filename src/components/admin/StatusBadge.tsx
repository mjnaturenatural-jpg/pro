import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  PENDING: "bg-sand-100 text-bark-600",
  CONFIRMED: "bg-leaf-100 text-leaf-700",
  PROCESSING: "bg-caramel-400/15 text-caramel-300",
  SHIPPED: "bg-blue-50 text-blue-600",
  OUT_FOR_DELIVERY: "bg-blue-50 text-blue-700",
  DELIVERED: "bg-leaf-100 text-leaf-700",
  CANCELLED: "bg-red-50 text-red-600",
  REFUNDED: "bg-red-50 text-red-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        STYLES[status] || "bg-sand-100 text-bark-600"
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
