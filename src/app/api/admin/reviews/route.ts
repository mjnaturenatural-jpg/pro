import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Review, Product } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const approved = searchParams.get("approved");
    await connectDB();
    const filter: Record<string, unknown> = {};
    if (approved === "true") filter.approved = true;
    if (approved === "false") filter.approved = false;
    const reviews = await Review.find(filter)
      .populate("product", "name slug")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return NextResponse.json({ reviews: JSON.parse(JSON.stringify(reviews)) });
  } catch (err) {
    console.error("admin reviews error", err);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

const createSchema = z.object({
  product: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
  approved: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid review data" }, { status: 400 });
    }
    await connectDB();
    const product = await Product.findById(parsed.data.product);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    // Admin-created reviews attributed to a system user placeholder are not supported;
    // reviews must come from real customers. Approve existing pending reviews instead.
    return NextResponse.json(
      { error: "Reviews must be created by customers after purchase" },
      { status: 400 }
    );
  } catch (err) {
    console.error("create review error", err);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
