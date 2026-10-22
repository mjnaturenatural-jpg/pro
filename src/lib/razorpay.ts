/**
 * Razorpay REST client (server-side only — reads credentials from the env).
 * No SDK dependency: every call is a plain authenticated fetch.
 * Docs: https://razorpay.com/docs/api/
 */

import crypto from "crypto";

const API_BASE = "https://api.razorpay.com/v1";
const REQUEST_TIMEOUT_MS = 15000;

interface Credentials {
  keyId: string;
  keySecret: string;
}

function getCredentials(): Credentials | null {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

export function isRazorpayConfigured(): boolean {
  return getCredentials() !== null;
}

export type RazorpayErrorCode =
  | "NOT_CONFIGURED"
  | "NETWORK"
  | "API_ERROR"
  | "MALFORMED";

export class RazorpayError extends Error {
  readonly code: RazorpayErrorCode;
  readonly status: number;
  constructor(message: string, code: RazorpayErrorCode, status = 0) {
    super(message);
    this.name = "RazorpayError";
    this.code = code;
    this.status = status;
  }
}

/**
 * Description of a Razorpay rejection, or "" for anything else — internal
 * errors must never leak their message to the client.
 */
export function razorpayErrorDescription(err: unknown): string {
  if (err instanceof RazorpayError) return err.message;
  const e = err as { error?: { description?: string } } | null;
  return e?.error?.description || "";
}

async function api<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  const creds = getCredentials();
  if (!creds) throw new RazorpayError("Razorpay is not configured", "NOT_CONFIGURED");
  const auth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString("base64");

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: init.method || "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new RazorpayError("Could not reach Razorpay", "NETWORK");
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const apiError = (data as { error?: { code?: string; description?: string } } | null)?.error;
    throw new RazorpayError(
      apiError?.description || `Razorpay request failed (${res.status})`,
      "API_ERROR",
      res.status
    );
  }
  if (data === null) throw new RazorpayError("Razorpay returned an unreadable response", "MALFORMED");
  return data as T;
}

export interface RazorpayOrderEntity {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status?: string;
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

interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
}

function toPaymentInfo(p: RazorpayPaymentEntity): RazorpayPaymentInfo {
  return {
    id: p.id,
    orderId: p.order_id,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    method: p.method || "",
  };
}

/** Authoritative payment state straight from Razorpay (never trust the client). */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentInfo> {
  const p = await api<RazorpayPaymentEntity>(
    `/payments/${encodeURIComponent(paymentId)}`
  );
  return toPaymentInfo(p);
}

/** Capture an authorized payment (fallback when auto-capture is disabled). */
export async function captureRazorpayPayment(paymentId: string, amountPaise: number) {
  const p = await api<RazorpayPaymentEntity>(
    `/payments/${encodeURIComponent(paymentId)}/capture`,
    { method: "POST", body: { amount: amountPaise, currency: "INR" } }
  );
  return {
    id: p.id,
    status: p.status,
    order_id: p.order_id,
    amount: p.amount,
    method: p.method || "",
  };
}

export async function createRazorpayOrder(
  amountInRupees: number,
  receipt: string
): Promise<RazorpayOrderEntity> {
  return api<RazorpayOrderEntity>("/orders", {
    method: "POST",
    body: {
      amount: Math.round(amountInRupees * 100),
      currency: "INR",
      receipt,
      notes: {},
    },
  });
}

/** All payments recorded against a Razorpay order. */
export async function listPaymentsForOrder(rzpOrderId: string): Promise<RazorpayPaymentInfo[]> {
  const r = await api<{ entity?: RazorpayPaymentEntity[] }>(
    `/orders/${encodeURIComponent(rzpOrderId)}/payments`
  );
  return (r.entity || []).map(toPaymentInfo);
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
