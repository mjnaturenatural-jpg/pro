import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import {
  createShiprocketOrder,
  isShiprocketShipReady,
  packToKg,
  shiprocketTrackingUrl,
  trackShiprocketAwb,
} from "@/lib/shiprocket";
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
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
  notes: z.string().optional(),
  action: z.enum(["create_shiprocket_shipment", "refresh_shiprocket_tracking"]).optional(),
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

    if (parsed.data.action === "create_shiprocket_shipment") {
      if (order.awb) {
        return NextResponse.json({ error: "A shipment already exists for this order" }, { status: 400 });
      }
      if (!isShiprocketShipReady()) {
        return NextResponse.json(
          { error: "Shiprocket pickup location is not configured. Set SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD and SHIPROCKET_PICKUP_LOCATION." },
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
        const result = await createShiprocketOrder({
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
        if (result.ok && result.awb) {
          order.awb = result.awb;
          order.shippingProvider = result.courier ? `Shiprocket:${result.courier}` : "Shiprocket";
          order.trackingUrl = shiprocketTrackingUrl(result.awb);
          order.shipmentStatus = "Shipment created";
          order.status = "SHIPPED";
          await order.save();
          return NextResponse.json({ ok: true, order: JSON.parse(JSON.stringify(order)) });
        }
        return NextResponse.json(
          { error: "Shiprocket accepted the order but did not assign an AWB. Check the pickup location and courier assignment in Shiprocket." },
          { status: 502 }
        );
      } catch (err) {
        console.error("shiprocket create error", err);
        const message = err instanceof Error ? err.message : "Failed to create shipment with Shiprocket";
        return NextResponse.json({ error: message }, { status: 502 });
      }
    }

    if (parsed.data.action === "refresh_shiprocket_tracking") {
      if (!order.awb) {
        return NextResponse.json({ error: "No AWB generated for this order yet" }, { status: 400 });
      }
      if (!order.shippingProvider?.startsWith("Shiprocket")) {
        return NextResponse.json({ error: "This is not a Shiprocket shipment" }, { status: 400 });
      }
      try {
        const t = await trackShiprocketAwb(order.awb);
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
        await order.save();
        return NextResponse.json({ ok: true, order: JSON.parse(JSON.stringify(order)) });
      } catch (err) {
        console.error("shiprocket tracking error", err);
        const message = err instanceof Error ? err.message : "Failed to refresh tracking";
        return NextResponse.json({ error: message }, { status: 502 });
      }
    }

    if (parsed.data.status) order.status = parsed.data.status;
    if (parsed.data.paymentStatus) order.paymentStatus = parsed.data.paymentStatus;
    if (parsed.data.notes !== undefined) order.notes = parsed.data.notes;
    await order.save();
    return NextResponse.json({ ok: true, order: JSON.parse(JSON.stringify(order)) });
  } catch (err) {
    console.error("admin order update error", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
