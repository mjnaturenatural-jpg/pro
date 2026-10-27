"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Truck, RefreshCw, PackageCheck, ShieldCheck, Link2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const PAYMENT_TONE: Record<string, string> = {
  PAID: "text-leaf-600",
  FAILED: "text-red-500",
  REFUNDED: "text-blue-600",
  PENDING: "text-caramel-600",
};

export function AdminOrderActions({
  orderId,
  status,
  paymentStatus,
  razorpayOrderId,
  razorpayPaymentId,
  awb,
  trackingUrl,
  delhiveryShipmentId,
  shipmentStatus,
  shipmentError,
  delhiveryReady,
  statuses,
}: {
  orderId: string;
  status: string;
  paymentStatus: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  awb: string;
  trackingUrl: string;
  delhiveryShipmentId: string;
  shipmentStatus: string;
  shipmentError: string;
  delhiveryReady: boolean;
  statuses: string[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState("");

  const patch = async (
    body: Record<string, unknown>,
    label: string
  ): Promise<Record<string, unknown> | null> => {
    setLoading(label);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          message:
            label === "reconcile" && data.paymentStatus
              ? `Payment check: ${data.paymentStatus}`
              : typeof data.message === "string" && data.message
                ? data.message
                : "Order updated",
          type: "success",
        });
        router.refresh();
        return data as Record<string, unknown>;
      }
      toast({ message: data.error || "Update failed", type: "error" });
      return null;
    } catch {
      toast({ message: "Update failed", type: "error" });
      return null;
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
          <div className="flex min-h-[42px] flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full bg-ivory-100 px-2.5 py-1 text-xs font-bold ${
                PAYMENT_TONE[paymentStatus] || "text-bark-600"
              }`}
            >
              {paymentStatus}
            </span>
            {razorpayPaymentId && (
              <span className="font-mono text-[11px] text-bark-400">{razorpayPaymentId}</span>
            )}
            {paymentStatus !== "PAID" &&
              paymentStatus !== "REFUNDED" &&
              razorpayOrderId && (
                <button
                  onClick={() => patch({ action: "reconcile_payment" }, "reconcile")}
                  disabled={loading === "reconcile"}
                  className="btn-secondary btn-sm"
                  title="Ask Razorpay whether this order's payment has been captured"
                >
                  <ShieldCheck size={14} />
                  {loading === "reconcile" ? "Checking…" : "Check Payment"}
                </button>
              )}
          </div>
          <p className="mt-1 text-[11px] text-bark-400">
            Payment status is set only by verified payments — it cannot be changed to PAID by hand.
          </p>
        </div>
      </div>

      {(delhiveryShipmentId || awb || shipmentStatus) && (
        <div className="rounded-xl bg-ivory-100 px-3.5 py-3 text-xs text-bark-600">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {delhiveryShipmentId && (
              <span>
                Shipment ID <span className="font-mono text-bark-900">{delhiveryShipmentId}</span>
              </span>
            )}
            {awb && (
              <span>
                AWB <span className="font-mono text-bark-900">{awb}</span>
              </span>
            )}
            {shipmentStatus && <span>Status: {shipmentStatus}</span>}
          </p>
          {shipmentError && <p className="mt-1.5 font-medium text-red-500">Last shipping error: {shipmentError}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!awb && !delhiveryShipmentId && (
          <button
            onClick={() => patch({ action: "create_delhivery_shipment" }, "delhivery-ship")}
            disabled={loading === "delhivery-ship" || !delhiveryReady}
            title={delhiveryReady ? undefined : "Delhivery token, pickup, and return details are required"}
            className="btn-primary btn-sm"
          >
            <Truck size={14} /> {loading === "delhivery-ship" ? "Creating…" : "Create Delhivery Shipment"}
          </button>
        )}
        {awb && (
          <button
            onClick={() => patch({ action: "refresh_delhivery_tracking" }, "track")}
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
            <Link2 size={14} /> Track Shipment
          </a>
        )}
      </div>
      {!awb && !delhiveryShipmentId && (
        <p className="text-xs text-bark-400">
          Shipment creation uses Delhivery and needs its API token plus configured pickup and return details. An order is
          shipped only after its payment is verified.
        </p>
      )}
    </div>
  );
}
