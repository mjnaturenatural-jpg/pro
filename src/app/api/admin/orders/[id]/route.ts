import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { createDelhiveryShipment, trackDelhiveryShipment, trackingUrlFor } from "@/lib/delhivery";
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
  action: z.enum(["create_shipment", "refresh_tracking"]).optional(),
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

    if (parsed.data.action === "create_shipment") {
      const awb = order.awb || `MJN${Date.now().toString().slice(-10)}`;
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
      const result = await createDelhiveryShipment({
        awb,
        orderNumber: order.orderNumber,
        name: addr.fullName,
        phone: addr.phone,
        address: [addr.line1, addr.line2, addr.area].filter(Boolean).join(", "),
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
      });
      if (result.ok) {
        order.awb = awb;
        order.shippingProvider = "Delhivery";
        order.trackingUrl = trackingUrlFor(awb);
        order.status = "SHIPPED";
        await order.save();
        return NextResponse.json({ ok: true, order: JSON.parse(JSON.stringify(order)) });
      }
      return NextResponse.json(
        { error: result.error || "Failed to create shipment with Delhivery" },
        { status: 502 }
      );
    }

    if (parsed.data.action === "refresh_tracking") {
      if (!order.awb) {
        return NextResponse.json({ error: "No AWB generated for this order yet" }, { status: 400 });
      }
      const result = await trackDelhiveryShipment(order.awb);
      if (result.ok) {
        const data = result.data as {
          Scans?: { status?: string; location?: string; scanDateTime?: string }[];
          status?: string;
        };
        const scans = data.Scans || [];
        if (scans.length) {
          const latest = scans[scans.length - 1];
          order.shipmentStatus = latest.status || order.shipmentStatus;
          order.shipmentHistory = scans.map((s) => ({
            status: s.status || "",
            location: s.location || "",
            timestamp: s.scanDateTime ? new Date(s.scanDateTime) : new Date(),
          })) as unknown as typeof order.shipmentHistory;
        }
        await order.save();
        return NextResponse.json({ ok: true, order: JSON.parse(JSON.stringify(order)) });
      }
      return NextResponse.json(
        { error: result.error || "Failed to refresh tracking" },
        { status: 502 }
      );
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
