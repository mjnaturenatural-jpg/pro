import Razorpay from "razorpay";
import crypto from "crypto";

export function getRazorpay(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export async function createRazorpayOrder(amountInRupees: number, receipt: string) {
  const razorpay = getRazorpay();
  if (!razorpay) throw new Error("Razorpay is not configured");
  return razorpay.orders.create({
    amount: Math.round(amountInRupees * 100),
    currency: "INR",
    receipt,
    notes: {},
  });
}

/** razorpay-node rejects with a plain `{ error: { description } }` object, not an Error. */
export function describeRazorpayError(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  const e = err as { error?: { description?: string } } | null;
  return e?.error?.description || fallback;
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export interface RazorpayPaymentInfo {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
}

/** Authoritative payment state straight from Razorpay (never trust the client). */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentInfo> {
  const razorpay = getRazorpay();
  if (!razorpay) throw new Error("Razorpay is not configured");
  const p = (await razorpay.payments.fetch(paymentId)) as unknown as {
    id: string;
    order_id: string;
    amount: number;
    currency: string;
    status: string;
    method?: string;
  };
  return {
    id: p.id,
    orderId: p.order_id,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    method: p.method || "",
  };
}

/** Capture an authorized payment (fallback when auto-capture is disabled). */
export async function captureRazorpayPayment(paymentId: string, amountPaise: number) {
  const razorpay = getRazorpay();
  if (!razorpay) throw new Error("Razorpay is not configured");
  return (await razorpay.payments.capture(paymentId, amountPaise, "INR")) as unknown as {
    id: string;
    status: string;
    order_id: string;
    amount: number;
    method?: string;
  };
}

/** All payments recorded against a Razorpay order. */
export async function listPaymentsForOrder(rzpOrderId: string): Promise<RazorpayPaymentInfo[]> {
  const razorpay = getRazorpay();
  if (!razorpay) throw new Error("Razorpay is not configured");
  const r = (await razorpay.orders.fetchPayments(rzpOrderId)) as unknown as {
    items?: {
      id: string;
      order_id: string;
      amount: number;
      currency: string;
      status: string;
      method?: string;
    }[];
  };
  return (r.items || []).map((p) => ({
    id: p.id,
    orderId: p.order_id,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    method: p.method || "",
  }));
}

/** Verify a webhook payload signature against the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
