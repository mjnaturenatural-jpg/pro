import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { reconcileOrderPayment, tokensMatch } from "@/lib/payments";

export const dynamic = "force-dynamic";

/**
 * Customer-facing payment status with server-side reconciliation.
 * Requires the order's private access token (?token=). If the order is still
 * PENDING, payments recorded against its Razorpay order are checked; a
 * captured payment finalizes the order, and an authorized-but-uncaptured
 * payment is captured here as a fallback.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = new URL(req.url).searchParams.get("token") || "";
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectDB();
    let raw: unknown = null;
    try {
      raw = await Order.findById(params.id).lean();
    } catch {
      raw = null; // invalid ObjectId
    }
    const order = raw as unknown as {
      _id: unknown;
      orderNumber: string;
      paymentStatus: string;
      status: string;
      total: number;
      paidAt: Date | null;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      accessToken: string;
      lastReconciledAt: Date | null;
      paymentMethod: string;
    } | null;

    // Same response for missing, malformed, and foreign ids — never confirm
    // whether an order id exists.
    if (!order || !tokensMatch(token, order.accessToken)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reconcile a pending order with Razorpay — throttled to avoid hammering.
    if (order.paymentStatus === "PENDING" && order.razorpayOrderId) {
      const last = order.lastReconciledAt ? new Date(order.lastReconciledAt).getTime() : 0;
      if (Date.now() - last > 8000) {
        await Order.updateOne({ _id: order._id }, { $set: { lastReconciledAt: new Date() } });
        try {
          await reconcileOrderPayment(order);
        } catch (err) {
          console.error("status reconciliation error", err);
        }
        const fresh = await Order.findById(params.id).lean();
        const f = fresh as unknown as typeof order;
        return NextResponse.json({
          paymentStatus: f?.paymentStatus || order.paymentStatus,
          status: f?.status || order.status,
          orderNumber: order.orderNumber,
          paidAt: f?.paidAt || null,
          razorpayPaymentId: f?.razorpayPaymentId || "",
          paymentMethod: f?.paymentMethod || "",
        });
      }
    }

    return NextResponse.json({
      paymentStatus: order.paymentStatus,
      status: order.status,
      orderNumber: order.orderNumber,
      paidAt: order.paidAt,
      razorpayPaymentId: order.razorpayPaymentId,
      paymentMethod: order.paymentMethod,
    });
  } catch (err) {
    console.error("order status error", err);
    return NextResponse.json({ error: "Failed to load status" }, { status: 500 });
  }
}
