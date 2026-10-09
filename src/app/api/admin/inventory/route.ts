import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product, Category } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { connectDB as db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Number(searchParams.get("limit") || 30));
    const category = searchParams.get("category") || "";
    const inStockOnly = searchParams.get("inStock") === "true";

    await db();
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (inStockOnly) filter["packSizes.stock"] = { $gt: 0 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("name slug packSizes images featured published")
        .lean(),
      Product.countDocuments(filter),
    ]);

    const rows = products.map((p) => {
      const prod = p as unknown as {
        _id: string;
        name: string;
        slug: string;
        images: string[];
        featured: boolean;
        published: boolean;
        packSizes: { label: string; stock: number; price: number; mrp: number }[];
      };
      return {
        _id: prod._id,
        name: prod.name,
        slug: prod.slug,
        image: prod.images[0] || "",
        featured: prod.featured,
        published: prod.published,
        totalStock: prod.packSizes.reduce((s, ps) => s + ps.stock, 0),
        packSizes: prod.packSizes,
      };
    });

    return NextResponse.json({ products: rows, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("inventory error", err);
    return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
  }
}
