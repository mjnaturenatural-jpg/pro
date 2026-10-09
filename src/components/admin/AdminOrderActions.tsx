"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Truck, RefreshCw, PackageCheck } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function AdminOrderActions({
  orderId,
  status,
  paymentStatus,
  awb,
  trackingUrl,
  statuses,
  paymentStatuses,
}: {
  orderId: string;
  status: string;
  paymentStatus: string;
  awb: string;
  trackingUrl: string;
  statuses: string[];
  paymentStatuses: string[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState("");

  const patch = async (body: Record<string, unknown>, label: string) => {
    setLoading(label);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ message: "Order updated", type: "success" });
        router.refresh();
      } else {
        toast({ message: data.error || "Update failed", type: "error" });
      }
    } catch {
      toast({ message: "Update failed", type: "error" });
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="card space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Shipping Status</label>
          <select
            className="input"
            value={status}
            disabled={loading === "status"}
            onChange={(e) => patch({ status: e.target.value }, "status")}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Payment Status</label>
          <select
            className="input"
            value={paymentStatus}
            disabled={loading === "payment"}
            onChange={(e) => patch({ paymentStatus: e.target.value }, "payment")}
          >
            {paymentStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!awb && (
          <button
            onClick={() => patch({ action: "create_shipment" }, "ship")}
            disabled={loading === "ship"}
            className="btn-primary btn-sm"
          >
            <Truck size={14} /> {loading === "ship" ? "Creating…" : "Create Delhivery Shipment"}
          </button>
        )}
        {awb && (
          <button
            onClick={() => patch({ action: "refresh_tracking" }, "track")}
            disabled={loading === "track"}
            className="btn-secondary btn-sm"
          >
            <RefreshCw size={14} /> {loading === "track" ? "Refreshing…" : "Refresh Tracking"}
          </button>
        )}
        {status !== "DELIVERED" && status !== "CANCELLED" && (
          <button
            onClick={() => patch({ status: "CONFIRMED" }, "confirm")}
            disabled={loading === "confirm"}
            className="btn-secondary btn-sm"
          >
            <PackageCheck size={14} /> Mark Confirmed
          </button>
        )}
        {trackingUrl && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary btn-sm"
          >
            Track on Delhivery
          </a>
        )}
      </div>
      {!awb && (
        <p className="text-xs text-bark-400">
          Shipment creation requires Delhivery API credentials to be configured in the environment.
        </p>
      )}
    </div>
  );
}
