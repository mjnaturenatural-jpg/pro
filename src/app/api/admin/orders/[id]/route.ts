import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import {
  createDeliveryOrder,
  isDeliveryShipReady,
  packToKg,
  deliveryTrackingUrl,
  trackDeliveryAwb,
} from "@/lib/delhivery";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { reconcileOrderPayment } from "@/lib/payments";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "REFUNDED",
    ])
    .optional(),
  // PAID is intentionally absent: an order may only become PAID through a
  // verified Razorpay payment (verify endpoint, webhook or reconcile below).
  paymentStatus: z.enum(["FAILED", "REFUNDED"]).optional(),
  notes: z.string().optional(),
  action: z
    .enum([
      "create_delhivery_shipment",
      "refresh_delhivery_tracking",
      "reconcile_payment",
    ])
    .optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const order = await Order.findById(params.id).lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order: JSON.parse(JSON.stringify(order)) });
  } catch (err) {
    console.error("admin order detail error", err);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }
    await connectDB();
    const order = await Order.findById(params.id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (parsed.data.action === "create_delhivery_shipment") {
      if (order.awb || order.delhiveryShipmentId) {
        return NextResponse.json({ error: "A shipment already exists for this order" }, { status: 400 });
      }
      // A prepaid order may only be fulfilled after a verified payment.
      if (order.paymentStatus !== "PAID") {
        return NextResponse.json(
          { error: "This order is not paid yet. A shipment is created only after a verified payment. Use 'Check Payment' to verify with Razorpay." },
          { status: 409 }
        );
      }
      if (!isDeliveryShipReady()) {
        return NextResponse.json(
          { error: "Delhivery pickup location is not configured. Set DELIVERY_API_TOKEN, DELIVERY_PICKUP_LOCATION, DELIVERY_PICKUP_POSTCODE and return details." },
          { status: 503 }
        );
      }
      const addr = order.address as unknown as {
        fullName: string;
        phone: string;
        line1: string;
        line2?: string;
        area: string;
        city: string;
        state: string;
        pincode: string;
      };
      const cust = order.customer as unknown as { email: string };
      const orderItems = (
        order.items as unknown as { name: string; sku?: string; packSize: string; price: number; quantity: number }[]
      ).map((i) => ({
        name: i.name,
        sku: i.sku || "",
        units: i.quantity,
        sellingPrice: i.price,
      }));
      const weightKg = (
        order.items as unknown as { packSize: string; quantity: number }[]
      ).reduce((n, i) => n + packToKg(i.packSize) * i.quantity, 0);
      try {
        const result = await createDeliveryOrder({
          orderId: order.orderNumber,
          customerName: addr.fullName,
          customerEmail: cust.email,
          customerPhone: addr.phone,
          addressLine: [addr.line1, addr.line2, addr.area].filter(Boolean).join(", "),
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          items: orderItems,
          subTotal: order.subtotal,
          weightKg,
          prepaid: order.paymentStatus === "PAID",
        });
        // Delhivery's legacy create endpoint returns the waybill immediately.
        // Persist it before changing order state so retries never duplicate it.
        if (result.orderId) order.delhiveryOrderId = String(result.orderId);
        if (result.shipmentId) order.delhiveryShipmentId = String(result.shipmentId);
        order.shipmentCreatedAt = order.shipmentCreatedAt || new Date();
        order.shipmentUpdatedAt = new Date();
        order.shipmentError = "";
        order.awb = result.awb;
        order.shippingProvider = result.courier ? `Delhivery:${result.courier}` : "Delhivery";
        order.trackingUrl = deliveryTrackingUrl(result.awb);
        order.shipmentStatus = "Shipment created";
        if (["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status)) order.status = "SHIPPED";
        await order.save();
        return NextResponse.json({ ok: true, order: JSON.parse(JSON.stringify(order)) });
      } catch (err) {
        console.error("delhivery create error", err);
        const message = err instanceof Error ? err.message : "Failed to create shipment with Delhivery";
        order.shipmentError = message;
        await order.save().catch(() => {});
        return NextResponse.json({ error: message }, { status: 502 });
      }
    }

    if (parsed.data.action === "refresh_delhivery_tracking") {
      if (!order.awb) {
        return NextResponse.json({ error: "No AWB generated for this order yet" }, { status: 400 });
      }
      if (!order.shippingProvider?.startsWith("Delhivery")) {
        return NextResponse.json({ error: "This is not a Delhivery shipment" }, { status: 400 });
      }
      try {
        const t = await trackDeliveryAwb(order.awb);
        if (t.scans.length) {
          const latest = t.scans[t.scans.length - 1];
          order.shipmentStatus = latest.status || t.status || order.shipmentStatus;
          order.shipmentHistory = t.scans.map((s) => ({
            status: s.status || "",
            location: s.location || "",
            timestamp: s.timestamp,
          })) as unknown as typeof order.shipmentHistory;
        } else if (t.status) {
          order.shipmentStatus = t.status;
        }
        order.shipmentUpdatedAt = new Date();
        order.shipmentError = "";
        await order.save();
        return NextResponse.json({ ok: true, order: JSON.parse(JSON.stringify(order)) });
      } catch (err) {
        console.error("delhivery tracking error", err);
        const message = err instanceof Error ? err.message : "Failed to refresh tracking";
        order.shipmentError = message;
        await order.save().catch(() => {});
        return NextResponse.json({ error: message }, { status: 502 });
      }
    }

    if (parsed.data.action === "reconcile_payment") {
      if (!order.razorpayOrderId) {
        return NextResponse.json(
          { error: "No Razorpay payment attempt exists for this order" },
          { status: 400 }
        );
      }
      if (order.paymentStatus === "PAID" || order.paymentStatus === "REFUNDED") {
        return NextResponse.json({
          ok: true,
          paymentStatus: order.paymentStatus,
          order: JSON.parse(JSON.stringify(order)),
        });
      }
      if (!isRazorpayConfigured()) {
        const missing = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"].filter((k) => !process.env[k]);
        return NextResponse.json(
          { error: `Razorpay is not configured. Set ${missing.join(" and ")} in the server environment.` },
          { status: 503 }
        );
      }
      try {
        const result = await reconcileOrderPayment(order);
        const fresh = await Order.findById(params.id);
        return NextResponse.json({
          ok: true,
          paymentStatus: result.paymentStatus,
          order: JSON.parse(JSON.stringify(fresh || order)),
        });
      } catch (err) {
        console.error("admin reconcile error", err);
        return NextResponse.json(
          { error: "Could not verify the payment with Razorpay. Please try again shortly." },
          { status: 502 }
        );
      }
    }

    if (parsed.data.status) order.status = parsed.data.status;
    if (parsed.data.paymentStatus) {
      const target = parsed.data.paymentStatus;
      const current = order.paymentStatus;
      // Paid is unreachable here (schema has no PAID); REFUNDED requires a
      // paid order and FAILED can only regress a still-pending payment, so a
      // confirmed payment can never be downgraded by hand.
      if (target === "REFUNDED" && current !== "PAID") {
        return NextResponse.json(
          { error: "Only a paid order can be marked as refunded" },
          { status: 400 }
        );
      }
      if (target === "FAILED" && current !== "PENDING") {
        return NextResponse.json(
          { error: "Only a pending payment can be marked as failed" },
          { status: 400 }
        );
      }
      order.paymentStatus = target;
    }
    if (parsed.data.notes !== undefined) order.notes = parsed.data.notes;
    await order.save();
    return NextResponse.json({ ok: true, order: JSON.parse(JSON.stringify(order)) });
  } catch (err) {
    console.error("admin order update error", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
