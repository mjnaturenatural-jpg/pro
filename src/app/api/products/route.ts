import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(48, Number(searchParams.get("limit") || 24));
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "featured";
    const q = searchParams.get("q") || "";
    const pack = searchParams.get("pack") || "";
    const inStock = searchParams.get("inStock") === "true";
    const maxPrice = Number(searchParams.get("maxPrice") || 0);
    const minDiscount = Number(searchParams.get("minDiscount") || 0);
    const featured = searchParams.get("featured") === "true";

    await connectDB();
    const filter: Record<string, unknown> = { published: true };

    if (category) {
      const { Category } = await import("@/models");
      const cat = await Category.findOne({ slug: category }).lean();
      if (cat) filter.category = (cat as { _id: unknown })._id;
    }
    if (q) {
      const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      filter.$or = [{ name: rx }, { keywords: rx }, { shortDescription: rx }];
    }
    if (pack) filter["packSizes.label"] = pack;
    if (inStock) filter["packSizes.stock"] = { $gt: 0 };
    if (maxPrice > 0) filter["packSizes.price"] = { ...(filter["packSizes.price"] as object), $lte: maxPrice };
    if (minDiscount > 0) {
      // approximate: selling price <= mrp * (1 - minDiscount/100)
      filter.$expr = {
        $gte: [
          { $multiply: [100, { $divide: [{ $subtract: ["$packSizes.mrp", "$packSizes.price"] }, "$packSizes.mrp"] }] },
          minDiscount,
        ],
      };
    }
    if (featured) filter.featured = true;

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      featured: { featured: -1, totalSold: -1, createdAt: -1 },
      price_asc: { "packSizes.price": 1 },
      price_desc: { "packSizes.price": -1 },
      newest: { createdAt: -1 },
      best_selling: { totalSold: -1 },
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort(sortMap[sort] || sortMap.featured)
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
    console.error("products list error", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
