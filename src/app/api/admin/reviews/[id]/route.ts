import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Review, Product } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({ approved: z.boolean() });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    await connectDB();
    const review = await Review.findByIdAndUpdate(params.id, { approved: parsed.data.approved }, { new: true });
    if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

    // recalc product rating
    const agg = await Review.aggregate([
      { $match: { product: review.product, approved: true } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    await Product.findByIdAndUpdate(review.product, {
      averageRating: Math.round((agg[0]?.avg || 0) * 10) / 10,
      reviewCount: agg[0]?.count || 0,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("review update error", err);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
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
    const review = await Review.findByIdAndDelete(params.id);
    if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
    const agg = await Review.aggregate([
      { $match: { product: review.product, approved: true } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    await Product.findByIdAndUpdate(review.product, {
      averageRating: Math.round((agg[0]?.avg || 0) * 10) / 10,
      reviewCount: agg[0]?.count || 0,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("review delete error", err);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
