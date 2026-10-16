import crypto from "crypto";
import { Order } from "@/models";
import { listPaymentsForOrder, captureRazorpayPayment } from "@/lib/razorpay";

/**
 * Mark an order as paid exactly once and run inventory/coupon side effects.
 * The paymentStatus filter makes this idempotent under races between the
 * browser callback, webhooks and status reconciliation. Refunded orders are
 * never re-finalized by a late capture event.
 */
export async function finalizePaidOrder(
  orderId: unknown,
  opts: { paymentId?: string; method?: string } = {}
) {
  const transitioned = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: { $nin: ["PAID", "REFUNDED"] } },
    {
      $set: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        paidAt: new Date(),
        lastReconciledAt: new Date(),
        ...(opts.paymentId ? { razorpayPaymentId: opts.paymentId } : {}),
        ...(opts.method ? { paymentMethod: opts.method } : {}),
      },
    },
    { new: true }
  );
  if (!transitioned) return null;

  const { Product, Coupon } = await import("@/models");
  for (const item of transitioned.items as unknown as {
    productId: unknown;
    packSize: string;
    quantity: number;
  }[]) {
    await Product.updateOne(
      { _id: item.productId, "packSizes.label": item.packSize },
      { $inc: { "packSizes.$.stock": -item.quantity, totalSold: item.quantity } }
    );
  }
  if (transitioned.couponCode) {
    await Coupon.updateOne({ code: transitioned.couponCode }, { $inc: { usedCount: 1 } });
  }
  return transitioned;
}

export interface ReconcileableOrder {
  _id: unknown;
  razorpayOrderId?: string;
  total: number;
  paymentStatus: string;
}

export type ReconcileResult = {
  paymentStatus: "PAID" | "FAILED" | "PENDING" | "REFUNDED";
  paymentId?: string;
  method?: string;
};

/**
 * Compare an order against Razorpay's authoritative payment record and advance
 * its payment status if a captured payment exists. Shared by the customer
 * status endpoint, the admin reconcile action and checkout attempt reuse so
 * there is exactly one reconciliation code path.
 *
 * Guarantees:
 *  - never downgrades PAID or REFUNDED;
 *  - captures an authorized-but-uncaptured payment when auto-capture is off;
 *  - marks FAILED only when failures exist and nothing captured/authorized;
 *  - idempotent — safe to call repeatedly and concurrently.
 */
export async function reconcileOrderPayment(order: ReconcileableOrder): Promise<ReconcileResult> {
  const current = order.paymentStatus as ReconcileResult["paymentStatus"];
  if (current === "PAID" || current === "REFUNDED") return { paymentStatus: current };
  if (!order.razorpayOrderId) return { paymentStatus: current };

  const expectedPaise = Math.round(order.total * 100);
  const payments = await listPaymentsForOrder(order.razorpayOrderId);

  const captured = payments.find(
    (p) => p.status === "captured" && p.amount === expectedPaise && p.currency === "INR"
  );
  if (captured) {
    await finalizePaidOrder(order._id, {
      paymentId: captured.id,
      method: captured.method || "razorpay",
    });
    return {
      paymentStatus: "PAID",
      paymentId: captured.id,
      method: captured.method || "razorpay",
    };
  }

  const authorized = payments.find(
    (p) => p.status === "authorized" && p.amount === expectedPaise && p.currency === "INR"
  );
  if (authorized) {
    try {
      const cap = await captureRazorpayPayment(authorized.id, expectedPaise);
      if (cap.status === "captured") {
        await finalizePaidOrder(order._id, {
          paymentId: cap.id,
          method: cap.method || authorized.method || "razorpay",
        });
        return {
          paymentStatus: "PAID",
          paymentId: cap.id,
          method: cap.method || authorized.method || "razorpay",
        };
      }
    } catch {
      /* capture raced with another path — webhook or the next reconcile finishes it */
    }
    return { paymentStatus: current };
  }

  const healthy = payments.some((p) => p.status === "captured" || p.status === "authorized");
  const failed = payments.some((p) => p.status === "failed");
  if (current === "PENDING" && failed && !healthy) {
    await Order.updateOne(
      { _id: order._id, paymentStatus: "PENDING" },
      { $set: { paymentStatus: "FAILED", lastReconciledAt: new Date() } }
    );
    return { paymentStatus: "FAILED" };
  }
  return { paymentStatus: current };
}

/** Constant-time comparison for order access tokens. */
export function tokensMatch(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function newOrderAccessToken(): string {
  return crypto.randomBytes(24).toString("hex");
}
