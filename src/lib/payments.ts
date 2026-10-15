import crypto from "crypto";
import { Order } from "@/models";

/**
 * Mark an order as paid exactly once and run inventory/coupon side effects.
 * The paymentStatus filter makes this idempotent under races between the
 * browser callback, webhooks and status reconciliation.
 */
export async function finalizePaidOrder(
  orderId: unknown,
  opts: { paymentId?: string; method?: string } = {}
) {
  const transitioned = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: { $ne: "PAID" } },
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
