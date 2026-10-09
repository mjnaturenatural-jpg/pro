import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Coupon } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { couponInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ coupons: JSON.parse(JSON.stringify(coupons)) });
  } catch (err) {
    console.error("admin coupons error", err);
    return NextResponse.json({ error: "Failed to load coupons" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = couponInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid coupon data" },
        { status: 400 }
      );
    }
    await connectDB();
    const existing = await Coupon.findOne({ code: parsed.data.code });
    if (existing) {
      return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });
    }
    const coupon = await Coupon.create({
      ...parsed.data,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
    });
    return NextResponse.json({ ok: true, coupon: JSON.parse(JSON.stringify(coupon)) });
  } catch (err) {
    console.error("create coupon error", err);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
