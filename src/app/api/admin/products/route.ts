import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { productInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Number(searchParams.get("limit") || 20));
    await connectDB();
    const filter: Record<string, unknown> = {};
    if (q) {
      filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    return NextResponse.json({
      products: JSON.parse(JSON.stringify(products)),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("admin products error", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
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
    const parsed = productInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid product data" },
        { status: 400 }
      );
    }
    await connectDB();
    const { Product: P } = await import("@/models");
    const existing = await P.findOne({ slug: parsed.data.slug });
    if (existing) {
      return NextResponse.json({ error: "A product with this slug already exists" }, { status: 409 });
    }
    const product = await P.create(parsed.data);
    return NextResponse.json({ ok: true, product: JSON.parse(JSON.stringify(product)) });
  } catch (err) {
    console.error("create product error", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
