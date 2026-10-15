import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { verifyWebhookSignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

interface WebhookPayload {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id: string;
        order_id: string;
        status: string;
        amount: number;
      };
    };
    order?: {
      entity?: {
        id: string;
        receipt: string;
        amount: number;
      };
    };
  };
}

/**
 * Razorpay webhook receiver. Configure the URL
 * https://www.mjnaturenatural.com/api/payments/webhook in the Razorpay
 * dashboard (live mode) with events payment.captured, order.paid and
 * payment.failed, and set RAZORPAY_WEBHOOK_SECRET in the server env.
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

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const entity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;
      const rzpOrderId = entity?.order_id || orderEntity?.id || "";
      if (!rzpOrderId) return NextResponse.json({ received: true });

      const order = await Order.findOne({ razorpayOrderId: rzpOrderId });
      if (!order) return NextResponse.json({ received: true });

      // Never downgrade a paid order; only PENDING -> PAID transitions apply.
      if (order.paymentStatus === "PAID") return NextResponse.json({ received: true });
      if (entity && entity.status && entity.status !== "captured") {
        return NextResponse.json({ received: true });
      }
      if (entity && typeof entity.amount === "number") {
        const expectedPaise = Math.round(order.total * 100);
        if (entity.amount !== expectedPaise) {
          console.error("webhook amount mismatch", { rzpOrderId, got: entity.amount, expected: expectedPaise });
          return NextResponse.json({ received: true });
        }
      }
      order.paymentStatus = "PAID";
      order.status = "CONFIRMED";
      if (entity?.id) order.razorpayPaymentId = entity.id;
      await order.save();

      // Side effects exactly once (same guard as the verify API).
      const { Product } = await import("@/models");
      for (const item of order.items as unknown as { productId: unknown; packSize: string; quantity: number }[]) {
        await Product.updateOne(
          { _id: item.productId, "packSizes.label": item.packSize },
          { $inc: { "packSizes.$.stock": -item.quantity, totalSold: item.quantity } }
        );
      }
      if (order.couponCode) {
        const { Coupon } = await import("@/models");
        await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
      }
      return NextResponse.json({ received: true });
    }

    if (event.event === "payment.failed") {
      const entity = event.payload?.payment?.entity;
      const rzpOrderId = entity?.order_id || "";
      if (!rzpOrderId) return NextResponse.json({ received: true });
      // Only ever mark PENDING orders as failed — never touch a PAID order.
      await Order.findOneAndUpdate(
        { razorpayOrderId: rzpOrderId, paymentStatus: "PENDING" },
        { paymentStatus: "FAILED", ...(entity?.id ? { razorpayPaymentId: entity.id } : {}) }
      );
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("webhook processing error", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
