import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { resolveCart, computeTotals } from "@/lib/pricing";
import { checkoutSchema } from "@/lib/validation";
import {
  createRazorpayOrder,
  describeRazorpayError,
  isRazorpayConfigured,
  razorpayErrorDescription,
  razorpayKeyId,
} from "@/lib/razorpay";
import { newOrderAccessToken, reconcileOrderPayment } from "@/lib/payments";
import { Order } from "@/models";
import crypto from "crypto";
import {
  getCourierRates,
  isDeliveryConfigured,
  packToKg,
  DELIVERY_PICKUP_POSTCODE,
  DeliveryError,
} from "@/lib/delhivery";

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
      const missing: string[] = [];
      if (!razorpayKeyId()) missing.push("RAZORPAY_KEY_ID");
      if (!process.env.RAZORPAY_KEY_SECRET) missing.push("RAZORPAY_KEY_SECRET");
      console.error(`checkout rejected: Razorpay not configured (missing ${missing.join(", ")})`);
      return NextResponse.json(
        {
          error: "Online payments are not configured yet. Please try again later.",
          code: "NOT_CONFIGURED",
          missing,
        },
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

    // Verify an optional live courier selection server-side so the
    // charged amount can never be tampered with from the client.
    let shippingProvider = "";
    if (shippingOption) {
      if (!isDeliveryConfigured() || !DELIVERY_PICKUP_POSTCODE) {
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
        shippingProvider = `Delhivery:${match.courierName}`;
      } catch (err) {
        if (err instanceof DeliveryError) {
          return NextResponse.json(
            {
              error: "Live courier rates are unavailable right now. Please choose standard delivery.",
              code: err.code,
            },
            { status: err.code === "TIMEOUT" ? 504 : 502 }
          );
        }
        console.error("courier verification error", err);
        return NextResponse.json(
          { error: "Live courier rates are unavailable right now. Please choose standard delivery." },
          { status: 502 }
        );
      }
    }

    const totalsOut = {
      subtotal: totals.subtotal,
      couponDiscount: totals.couponDiscount,
      couponCode: totals.couponCode,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
    };

    // Reuse a recent unpaid attempt for the same customer and identical order
    // instead of creating a duplicate internal order on retries/double submits.
    const reuseCandidates = await Order.find({
      "customer.email": address.email,
      paymentStatus: "PENDING",
      status: "PENDING",
      razorpayOrderId: { $ne: "" },
      total: totals.total,
      shipping: totals.shipping,
      couponCode: totals.couponCode,
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const itemKey = (items: { productId: unknown; packSize: string; quantity: number }[]) =>
      items
        .map((i) => `${String(i.productId)}|${i.packSize}|${i.quantity}`)
        .sort()
        .join(";");
    const wantedKey = itemKey(
      resolved as unknown as { productId: unknown; packSize: string; quantity: number }[]
    );

    for (const candidate of reuseCandidates) {
      const cand = candidate as unknown as {
        _id: unknown;
        orderNumber: string;
        razorpayOrderId: string;
        accessToken: string;
        paymentStatus: string;
        items: { productId: unknown; packSize: string; quantity: number }[];
      };
      if (itemKey(cand.items) !== wantedKey) continue;

      // Authoritative check: if this attempt was already paid but the webhook
      // has not landed in the UI yet, report success instead of re-opening it.
      let paidNow = false;
      try {
        const rec = await reconcileOrderPayment({
          _id: cand._id,
          razorpayOrderId: cand.razorpayOrderId,
          total: totals.total,
          paymentStatus: cand.paymentStatus,
        });
        paidNow = rec.paymentStatus === "PAID";
      } catch (err) {
        console.error("checkout attempt reuse: reconcile failed", err);
        continue; // cannot confirm this attempt — start a fresh one
      }
      if (paidNow) {
        const fresh = (await Order.findById(cand._id).lean()) as { accessToken?: string } | null;
        return NextResponse.json({
          orderId: String(cand._id),
          orderNumber: cand.orderNumber,
          paid: true,
          accessToken: (fresh && fresh.accessToken) || cand.accessToken || "",
        });
      }

      const reused = await Order.findOneAndUpdate(
        { _id: cand._id, paymentStatus: "PENDING", status: "PENDING" },
        {
          $set: {
            customer: { name: address.fullName, email: address.email, phone: address.phone },
            address,
          },
        },
        { new: true }
      );
      if (!reused) continue; // paid or changed while we looked — start fresh
      return NextResponse.json({
        orderId: reused._id.toString(),
        orderNumber: reused.orderNumber,
        razorpayOrderId: reused.razorpayOrderId,
        amount: Math.round(totals.total * 100),
        currency: "INR",
        keyId: razorpayKeyId(),
        accessToken: reused.accessToken,
        totals: totalsOut,
      });
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
      currency: "INR",
      shippingProvider,
      paymentStatus: "PENDING",
      status: "PENDING",
      accessToken,
    });

    try {
      const rzpOrder = await createRazorpayOrder(totals.total, orderNumber);
      order.razorpayOrderId = rzpOrder.id;
      await order.save();
      return NextResponse.json({
        orderId: order._id.toString(),
        orderNumber,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: razorpayKeyId(),
        accessToken,
        totals: totalsOut,
      });
    } catch (err) {
      // Razorpay order creation failed after the internal order was written.
      // Keep the internal order (unpaid, no Razorpay id) for the audit trail
      // and surface only a safe message — no internal details.
      console.error("razorpay order creation failed", {
        orderNumber,
        err: describeRazorpayError(err, "unknown error"),
      });
      return NextResponse.json(
        { error: "Could not start the payment. Please try again.", code: "RAZORPAY_ORDER_FAILED" },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("checkout error", err);
    // Razorpay rejections carry a description; anything else is internal —
    // return a generic message so DB/driver details never reach the client.
    const razorpayDescription = razorpayErrorDescription(err);
    return NextResponse.json(
      {
        error: razorpayDescription
          ? describeRazorpayError(err, "Checkout failed")
          : "Checkout failed. Please try again.",
        code: razorpayDescription ? "RAZORPAY_ERROR" : "INTERNAL",
      },
      { status: 500 }
    );
  }
}
