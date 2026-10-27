import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category, Product } from "@/models";
import { isValidObjectId } from "mongoose";
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
    const number = (value: string | null, fallback: number, min: number, max: number) => {
      const parsed = Number.parseInt(value || "", 10);
      return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
    };
    const page = number(searchParams.get("page"), 1, 1, 100000);
    const limit = number(searchParams.get("limit"), 20, 1, 50);
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
    const existing = await Product.findOne({ slug: parsed.data.slug });
    if (existing) {
      return NextResponse.json({ error: "A product with this slug already exists" }, { status: 409 });
    }
    if (!isValidObjectId(parsed.data.category) || !(await Category.exists({ _id: parsed.data.category }))) {
      return NextResponse.json({ error: "Select an existing category" }, { status: 400 });
    }
    const product = await Product.create(parsed.data);
    return NextResponse.json({ ok: true, product: JSON.parse(JSON.stringify(product)) });
  } catch (err) {
    console.error("create product error", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
