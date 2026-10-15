import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { fetchRazorpayPayment, verifyRazorpaySignature } from "@/lib/razorpay";
import { finalizePaidOrder } from "@/lib/payments";
import { z } from "zod";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

    await connectDB();
    const existing = await Order.findOne({ razorpayOrderId: razorpay_order_id }).lean();
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    // Always verify the signature first — never short-circuit before it, or a
    // forged request could read the order's access token.
    const valid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    if (!valid) {
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id, paymentStatus: "PENDING" },
        { paymentStatus: "FAILED", razorpayPaymentId: razorpay_payment_id }
      );
      return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
    }
    // Idempotent: already paid (e.g. retried callback or webhook won the race).
    if ((existing as { paymentStatus: string }).paymentStatus === "PAID") {
      return NextResponse.json({
        ok: true,
        orderId: String((existing as { _id: unknown })._id),
        orderNumber: (existing as { orderNumber: string }).orderNumber,
        accessToken: (existing as { accessToken?: string }).accessToken || "",
      });
    }

    // Authoritative check: the payment must be captured for THIS order and amount.
    let payment;
    try {
      payment = await fetchRazorpayPayment(razorpay_payment_id);
    } catch (err) {
      console.error("razorpay payment fetch failed", err);
      return NextResponse.json(
        { error: "Could not confirm the payment with Razorpay. Please try again." },
        { status: 502 }
      );
    }
    const expectedPaise = Math.round((existing as { total: number }).total * 100);
    if (payment.orderId !== razorpay_order_id || payment.amount !== expectedPaise) {
      console.error("payment/order mismatch", {
        paymentId: razorpay_payment_id,
        paymentOrder: payment.orderId,
        expectedOrder: razorpay_order_id,
        paymentAmount: payment.amount,
        expectedAmount: expectedPaise,
      });
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id, paymentStatus: "PENDING" },
        { paymentStatus: "FAILED", razorpayPaymentId: razorpay_payment_id }
      );
      return NextResponse.json({ error: "Payment details do not match this order" }, { status: 400 });
    }
    if (payment.status !== "captured") {
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id, paymentStatus: "PENDING" },
        { paymentStatus: "FAILED", razorpayPaymentId: razorpay_payment_id }
      );
      return NextResponse.json(
        { error: "Payment was not captured. No money has been charged." },
        { status: 400 }
      );
    }

    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, lastReconciledAt: new Date() }
    );
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const paid = await finalizePaidOrder(order._id, {
      paymentId: razorpay_payment_id,
      method: payment.method || "razorpay",
    });
    if (!paid) {
      // Lost a race with the webhook — confirm the order is actually paid.
      const current = (await Order.findById(order._id).lean()) as unknown as {
        paymentStatus: string;
        orderNumber: string;
        accessToken?: string;
      } | null;
      if (current?.paymentStatus === "PAID") {
        return NextResponse.json({
          ok: true,
          orderId: String(order._id),
          orderNumber: current.orderNumber,
          accessToken: current.accessToken || "",
        });
      }
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      orderId: paid._id.toString(),
      orderNumber: paid.orderNumber,
      accessToken: (paid as { accessToken?: string }).accessToken || "",
    });
  } catch (err) {
    console.error("verify payment error", err);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
