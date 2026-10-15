import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import {
  captureRazorpayPayment,
  fetchRazorpayPayment,
  verifyWebhookSignature,
} from "@/lib/razorpay";
import { finalizePaidOrder } from "@/lib/payments";

export const dynamic = "force-dynamic";

interface WebhookPayment {
  id: string;
  order_id: string;
  status: string;
  amount: number;
  method?: string;
}

interface WebhookPayload {
  id?: string;
  event: string;
  payload?: {
    payment?: { entity?: WebhookPayment };
    order?: { entity?: { id: string; receipt: string; amount: number } };
  };
}

/**
 * Razorpay webhook receiver. Configure in the Razorpay dashboard:
 * URL    https://www.mjnaturenatural.com/api/payments/webhook
 * Secret must match RAZORPAY_WEBHOOK_SECRET in the server env.
 * Events payment.authorized, payment.captured, payment.failed, order.paid.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error("webhook received but RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let event: WebhookPayload;
  try {
    event = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    await connectDB();

    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;
    const rzpOrderId = paymentEntity?.order_id || orderEntity?.id || "";
    if (!rzpOrderId) return NextResponse.json({ received: true });

    const order = await Order.findOne({ razorpayOrderId: rzpOrderId });
    if (!order) return NextResponse.json({ received: true });

    // Idempotency: record event ids; duplicate deliveries are acknowledged
    // without reprocessing.
    if (event.id) {
      const already = (order as { webhookEvents?: string[] }).webhookEvents || [];
      if (already.includes(event.id)) return NextResponse.json({ received: true, duplicate: true });
    }

    if (event.event === "payment.authorized") {
      // Payment authorized but not captured — common when the Razorpay account
      // does not have automatic capture enabled. Capture it now so the customer
      // is actually charged and the dashboard reflects the collection.
      if (!paymentEntity?.id) return NextResponse.json({ received: true });
      if (order.paymentStatus === "PAID") return NextResponse.json({ received: true });
      const expectedPaise = Math.round(order.total * 100);
      if (typeof paymentEntity.amount === "number" && paymentEntity.amount !== expectedPaise) {
        console.error("webhook amount mismatch (authorized)", { rzpOrderId, got: paymentEntity.amount, expected: expectedPaise });
        return NextResponse.json({ received: true });
      }
      try {
        const captured = await captureRazorpayPayment(paymentEntity.id, expectedPaise);
        if (captured.status === "captured") {
          await finalizePaidOrder(order._id, {
            paymentId: captured.id,
            method: captured.method || paymentEntity.method || "razorpay",
          });
        }
      } catch (err) {
        // Capture may fail if already captured elsewhere; confirm state.
        console.error("capture on authorized failed", err);
        try {
          const p = await fetchRazorpayPayment(paymentEntity.id);
          if (p.status === "captured") {
            await finalizePaidOrder(order._id, { paymentId: p.id, method: p.method || "razorpay" });
          }
        } catch {
          /* leave pending; browser verify or next event will reconcile */
        }
      }
      if (event.id) {
        await Order.updateOne({ _id: order._id }, { $addToSet: { webhookEvents: event.id }, $set: { lastReconciledAt: new Date() } });
      }
      return NextResponse.json({ received: true });
    }

    if (event.event === "payment.captured" || event.event === "order.paid") {
      if (order.paymentStatus === "PAID") return NextResponse.json({ received: true });
      if (paymentEntity && paymentEntity.status && paymentEntity.status !== "captured") {
        return NextResponse.json({ received: true });
      }
      if (paymentEntity && typeof paymentEntity.amount === "number") {
        const expectedPaise = Math.round(order.total * 100);
        if (paymentEntity.amount !== expectedPaise) {
          console.error("webhook amount mismatch", { rzpOrderId, got: paymentEntity.amount, expected: expectedPaise });
          return NextResponse.json({ received: true });
        }
      }
      await finalizePaidOrder(order._id, {
        paymentId: paymentEntity?.id,
        method: paymentEntity?.method || "razorpay",
      });
      if (event.id) {
        await Order.updateOne({ _id: order._id }, { $addToSet: { webhookEvents: event.id }, $set: { lastReconciledAt: new Date() } });
      }
      return NextResponse.json({ received: true });
    }

    if (event.event === "payment.failed") {
      // Only ever mark PENDING orders as failed — never touch a PAID order.
      await Order.findOneAndUpdate(
        { razorpayOrderId: rzpOrderId, paymentStatus: "PENDING" },
        {
          paymentStatus: "FAILED",
          lastReconciledAt: new Date(),
          ...(paymentEntity?.id ? { razorpayPaymentId: paymentEntity.id } : {}),
        }
      );
      if (event.id) {
        await Order.updateOne({ _id: order._id }, { $addToSet: { webhookEvents: event.id } });
      }
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("webhook processing error", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
