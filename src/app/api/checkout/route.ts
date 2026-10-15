import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { resolveCart, computeTotals } from "@/lib/pricing";
import { checkoutSchema } from "@/lib/validation";
import { createRazorpayOrder, describeRazorpayError, isRazorpayConfigured } from "@/lib/razorpay";
import { newOrderAccessToken } from "@/lib/payments";
import { Order } from "@/models";
import crypto from "crypto";
import {
  getCourierRates,
  isShiprocketConfigured,
  packToKg,
  SHIPROCKET_PICKUP_POSTCODE,
} from "@/lib/shiprocket";

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
    const { items, address, couponCode, shippingOption } = parsed.data;

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

    // Verify an optional live Shiprocket courier selection server-side so the
    // charged amount can never be tampered with from the client.
    let shippingProvider = "";
    if (shippingOption) {
      if (!isShiprocketConfigured() || !SHIPROCKET_PICKUP_POSTCODE) {
        return NextResponse.json(
          { error: "Live delivery options are unavailable. Please choose standard delivery." },
          { status: 502 }
        );
      }
      try {
        const weightKg = resolved.reduce((n, i) => n + packToKg(i.packSize) * i.quantity, 0);
        const options = await getCourierRates(address.pincode, weightKg);
        const match = options.find((o) => o.courierId === shippingOption.courierId);
        if (!match || Math.abs(match.rate - shippingOption.rate) > 0.01) {
          return NextResponse.json(
            { error: "The selected delivery option changed. Please reselect your courier." },
            { status: 409 }
          );
        }
        totals.shipping = match.rate;
        totals.total =
          Math.round((totals.subtotal - totals.couponDiscount + match.rate + totals.tax) * 100) /
          100;
        shippingProvider = `Shiprocket:${match.courierName}`;
      } catch (err) {
        console.error("courier verification error", err);
        return NextResponse.json(
          { error: "Live courier rates are unavailable right now. Please choose standard delivery." },
          { status: 502 }
        );
      }
    }

    const orderNumber = `MJN${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const accessToken = newOrderAccessToken();

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
      shippingProvider,
      paymentStatus: "PENDING",
      status: "PENDING",
      accessToken,
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
      accessToken,
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
    return NextResponse.json(
      { error: describeRazorpayError(err, "Checkout failed") },
      { status: 500 }
    );
  }
}
