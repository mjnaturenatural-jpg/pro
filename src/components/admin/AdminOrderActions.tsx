"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Truck, RefreshCw, PackageCheck, ShieldCheck, FileText, ClipboardList, CalendarClock, Link2 } from "lucide-react";
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
  shiprocketShipmentId,
  shipmentStatus,
  shipmentError,
  labelUrl,
  manifestUrl,
  shiprocketReady,
  statuses,
}: {
  orderId: string;
  status: string;
  paymentStatus: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  awb: string;
  trackingUrl: string;
  shiprocketShipmentId: string;
  shipmentStatus: string;
  shipmentError: string;
  labelUrl: string;
  manifestUrl: string;
  shiprocketReady: boolean;
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

  // For label/manifest the API returns a signed URL; open it in a new tab.
  const generateAndOpen = async (action: string, label: string, urlKey: string) => {
    const data = await patch({ action }, label);
    const url = data && typeof data[urlKey] === "string" ? (data[urlKey] as string) : "";
    if (url) window.open(url, "_blank", "noopener,noreferrer");
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

      {(shiprocketShipmentId || awb || shipmentStatus) && (
        <div className="rounded-xl bg-ivory-100 px-3.5 py-3 text-xs text-bark-600">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {shiprocketShipmentId && (
              <span>
                Shipment ID <span className="font-mono text-bark-900">{shiprocketShipmentId}</span>
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
        {!awb && !shiprocketShipmentId && (
          <button
            onClick={() => patch({ action: "create_shiprocket_shipment" }, "sr-ship")}
            disabled={loading === "sr-ship" || !shiprocketReady}
            title={shiprocketReady ? undefined : "Shiprocket login + pickup location required"}
            className="btn-primary btn-sm"
          >
            <Truck size={14} /> {loading === "sr-ship" ? "Creating…" : "Create Shiprocket Shipment"}
          </button>
        )}
        {!awb && shiprocketShipmentId && (
          <button
            onClick={() => patch({ action: "assign_shiprocket_awb" }, "sr-awb")}
            disabled={loading === "sr-awb"}
            className="btn-primary btn-sm"
          >
            <Truck size={14} /> {loading === "sr-awb" ? "Assigning…" : "Assign AWB"}
          </button>
        )}
        {awb && (
          <button
            onClick={() => patch({ action: "refresh_shiprocket_tracking" }, "track")}
            disabled={loading === "track"}
            className="btn-secondary btn-sm"
          >
            <RefreshCw size={14} /> {loading === "track" ? "Refreshing…" : "Refresh Tracking"}
          </button>
        )}
        {shiprocketShipmentId && (
          <button
            onClick={() => generateAndOpen("generate_shiprocket_label", "label", "labelUrl")}
            disabled={loading === "label"}
            className="btn-secondary btn-sm"
          >
            <FileText size={14} /> {loading === "label" ? "Generating…" : "Label"}
          </button>
        )}
        {shiprocketShipmentId && (
          <button
            onClick={() => generateAndOpen("generate_shiprocket_manifest", "manifest", "manifestUrl")}
            disabled={loading === "manifest"}
            className="btn-secondary btn-sm"
          >
            <ClipboardList size={14} /> {loading === "manifest" ? "Generating…" : "Manifest"}
          </button>
        )}
        {awb && (
          <button
            onClick={() => patch({ action: "request_shiprocket_pickup" }, "pickup")}
            disabled={loading === "pickup"}
            className="btn-secondary btn-sm"
          >
            <CalendarClock size={14} /> {loading === "pickup" ? "Requesting…" : "Request Pickup"}
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
      {!awb && !shiprocketShipmentId && (
        <p className="text-xs text-bark-400">
          Shipment creation uses Shiprocket and needs its login plus a configured pickup location. An order is
          shipped only after its payment is verified.
        </p>
      )}
    </div>
  );
}
