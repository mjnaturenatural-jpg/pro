import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { resolveCart, computeTotals } from "@/lib/pricing";
import { checkoutSchema } from "@/lib/validation";
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/razorpay";
import { Order } from "@/models";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid checkout data" },
        { status: 400 }
      );
    }
    const { items, address, couponCode } = parsed.data;

    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: "Online payments are not configured yet. Please try again later." },
        { status: 503 }
      );
    }

    const resolved = await resolveCart(items);
    if (!resolved.length) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    for (const item of resolved) {
      const product = await Product.findById(item.productId).lean();
      const pack = (product as unknown as { packSizes: { label: string; stock: number }[] })?.packSizes.find(
        (p) => p.label === item.packSize
      );
      if (!pack || pack.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${item.name} (${item.packSize})` },
          { status: 400 }
        );
      }
    }

    const totals = await computeTotals(resolved, couponCode);
    if (!totals.couponCode && couponCode) {
      // coupon invalid — proceed without discount but inform
    }

    const orderNumber = `MJN${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

    const order = await Order.create({
      orderNumber,
      customer: { name: address.fullName, email: address.email, phone: address.phone },
      address,
      items: resolved.map((i) => ({
        productId: i.productId,
        name: i.name,
        image: i.image,
        packSize: i.packSize,
        sku: i.sku,
        price: i.price,
        mrp: i.mrp,
        quantity: i.quantity,
        subtotal: i.subtotal,
      })),
      couponCode: totals.couponCode,
      couponDiscount: totals.couponDiscount,
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
      paymentStatus: "PENDING",
      status: "PENDING",
    });

    const rzpOrder = await createRazorpayOrder(totals.total, orderNumber);

    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    return NextResponse.json({
      orderId: order._id.toString(),
      orderNumber,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      totals: {
        subtotal: totals.subtotal,
        couponDiscount: totals.couponDiscount,
        couponCode: totals.couponCode,
        shipping: totals.shipping,
        tax: totals.tax,
        total: totals.total,
      },
    });
  } catch (err) {
    console.error("checkout error", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
