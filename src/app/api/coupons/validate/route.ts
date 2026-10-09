import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Coupon } from "@/models";
import { computeCouponDiscount } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { code, subtotal, userId } = await req.json();
    if (!code || typeof subtotal !== "number") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    await connectDB();
    const result = await computeCouponDiscount(code, subtotal, userId);
    return NextResponse.json({
      valid: result.valid,
      discount: result.discount,
      error: result.error,
      couponCode: result.valid ? code.toUpperCase().trim() : null,
    });
  } catch (err) {
    console.error("coupon error", err);
    return NextResponse.json({ error: "Could not validate coupon" }, { status: 500 });
  }
}
