import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Coupon } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  active: z.boolean().optional(),
  value: z.number().min(0).optional(),
  minOrder: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).nullable().optional(),
  usageLimit: z.number().min(0).nullable().optional(),
  perUserLimit: z.number().min(1).nullable().optional(),
  endsAt: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid coupon update" }, { status: 400 });
    }
    await connectDB();
    const update: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.endsAt) update.endsAt = new Date(parsed.data.endsAt);
    const coupon = await Coupon.findByIdAndUpdate(params.id, update, { new: true }).lean();
    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    return NextResponse.json({ ok: true, coupon: JSON.parse(JSON.stringify(coupon)) });
  } catch (err) {
    console.error("update coupon error", err);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    await Coupon.findByIdAndDelete(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete coupon error", err);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
