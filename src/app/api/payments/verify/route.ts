import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import {
  captureRazorpayPayment,
  fetchRazorpayPayment,
  isRazorpayConfigured,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import { finalizePaidOrder } from "@/lib/payments";
import { z } from "zod";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  // Optional binding supplied by our own checkout page; when present it must
  // match the internal order the Razorpay order id belongs to.
  internal_order_id: z.string().optional(),
});

// Best-effort per-instance rate limit for this unauthenticated endpoint.
// (Vercel serverless instances each keep their own bucket — this throttles
// abuse on a warm instance; it is a safety net, not a WAF.)
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 15;
const rateBuckets = new Map<string, { count: number; reset: number }>();
function rateLimited(key: string): boolean {
  const now = Date.now();
  if (rateBuckets.size > 500) {
    rateBuckets.forEach((v, k) => {
      if (now > v.reset) rateBuckets.delete(k);
    });
  }
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.reset) {
    rateBuckets.set(key, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  if (bucket.count >= RATE_MAX) return true;
  bucket.count += 1;
  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment payload" }, { status: 400 });
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internal_order_id } =
      parsed.data;

    if (!isRazorpayConfigured()) {
      const missing = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"].filter((k) => !process.env[k]);
      console.error(`payment verify rejected: Razorpay not configured (missing ${missing.join(", ")})`);
      return NextResponse.json(
        { error: "Payment verification is not available right now.", code: "NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    const clientIp = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "local";
    if (rateLimited(`payments:verify:${clientIp}`)) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    await connectDB();
    const existing = await Order.findOne({ razorpayOrderId: razorpay_order_id }).lean();
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    // Always verify the signature first — never short-circuit before it, or a
    // forged request could read the order's access token. An invalid signature
    // has no side effects on the order: failures are only ever recorded from
    // Razorpay's authoritative webhook/status reconciliation.
    const valid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    if (!valid) {
      return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
    }
    if (internal_order_id && internal_order_id !== String((existing as { _id: unknown })._id)) {
      return NextResponse.json({ error: "Payment does not match this order" }, { status: 400 });
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
    if (
      payment.orderId !== razorpay_order_id ||
      payment.currency !== "INR" ||
      payment.amount !== expectedPaise
    ) {
      console.error("payment/order mismatch", {
        paymentId: razorpay_payment_id,
        paymentOrder: payment.orderId,
        expectedOrder: razorpay_order_id,
        paymentAmount: payment.amount,
        paymentCurrency: payment.currency,
        expectedAmount: expectedPaise,
      });
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id, paymentStatus: "PENDING" },
        { paymentStatus: "FAILED", razorpayPaymentId: razorpay_payment_id }
      );
      return NextResponse.json({ error: "Payment details do not match this order" }, { status: 400 });
    }
    if (payment.status === "failed") {
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id, paymentStatus: "PENDING" },
        { paymentStatus: "FAILED", razorpayPaymentId: razorpay_payment_id, lastReconciledAt: new Date() }
      );
      return NextResponse.json(
        { error: "Payment failed. No money has been charged." },
        { status: 400 }
      );
    }
    if (payment.status !== "captured") {
      // Authorized but not captured (auto-capture off). Do not just defer to the
      // webhook — if the webhook is delayed or misconfigured the money would sit
      // authorized forever. The customer is right here, so attempt capture now,
      // reusing the same helper the status reconciliation path uses.
      if (payment.status === "authorized") {
        try {
          const cap = await captureRazorpayPayment(razorpay_payment_id, expectedPaise);
          if (cap.status === "captured") {
            const paid = await finalizePaidOrder(existing._id, {
              paymentId: razorpay_payment_id,
              method: cap.method || payment.method || "razorpay",
            });
            const doc = paid || (await Order.findById(existing._id).lean());
            const d = doc as { orderNumber?: string; accessToken?: string } | null;
            return NextResponse.json({
              ok: true,
              orderId: String((existing as { _id: unknown })._id),
              orderNumber: d?.orderNumber || (existing as { orderNumber: string }).orderNumber,
              accessToken: d?.accessToken || (existing as { accessToken?: string }).accessToken || "",
            });
          }
        } catch (err) {
          // Capture can race with the webhook; fall through to the pending path
          // rather than failing a payment that may already be captured.
          console.error("capture on verify failed", err);
        }
      }
      // Still not captured — not a failure. The status endpoint, the
      // payment.authorized webhook or a later reconcile finishes it.
      return NextResponse.json(
        {
          ok: false,
          code: "PENDING_CAPTURE",
          error: "Your payment is being confirmed. This usually takes a few seconds.",
        },
        { status: 202 }
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
