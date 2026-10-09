import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { verifyRazorpaySignature } from "@/lib/razorpay";
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

    const valid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    if (!valid) {
      await connectDB();
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { paymentStatus: "FAILED" }
      );
      return NextResponse.json({ error: "Payment signature verification failed" }, { status: 400 });
    }

    await connectDB();
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // decrement stock after successful payment
    const { Product } = await import("@/models");
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId, "packSizes.label": item.packSize },
        { $inc: { "packSizes.$.stock": -item.quantity, totalSold: item.quantity } }
      );
    }

    // increment coupon usage
    if (order.couponCode) {
      const { Coupon } = await import("@/models");
      await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
    }

    return NextResponse.json({
      ok: true,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    });
  } catch (err) {
    console.error("verify payment error", err);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
