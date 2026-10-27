import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category, Product } from "@/models";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const integer = (value: string | null, fallback: number, min: number, max: number) => {
      const parsed = Number.parseInt(value || "", 10);
      return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
    };
    const page = integer(searchParams.get("page"), 1, 1, 100000);
    const limit = integer(searchParams.get("limit"), 24, 1, 48);
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "featured";
    const q = searchParams.get("q") || "";
    const pack = searchParams.get("pack") || "";
    const inStock = searchParams.get("inStock") === "true";
    const maxPrice = Number(searchParams.get("maxPrice") || 0);
    const minDiscount = Number(searchParams.get("minDiscount") || 0);
    const featured = searchParams.get("featured") === "true";
    const tag = searchParams.get("tag") || "";

    await connectDB();
    const clauses: Record<string, unknown>[] = [{ published: true }];

    if (category) {
      const cat = await Category.findOne({ slug: category, published: true }).lean();
      if (!cat) {
        return NextResponse.json({ products: [], total: 0, page, pages: 0 });
      }
      clauses.push({ category: (cat as { _id: unknown })._id });
    }
    if (q) {
      const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      clauses.push({ $or: [{ name: rx }, { keywords: rx }, { shortDescription: rx }] });
    }
    const packFilter: Record<string, unknown> = {};
    if (pack) packFilter.label = pack;
    if (inStock) packFilter.stock = { $gt: 0 };
    if (Number.isFinite(maxPrice) && maxPrice > 0) packFilter.price = { $lte: maxPrice };
    if (Object.keys(packFilter).length) clauses.push({ packSizes: { $elemMatch: packFilter } });
    if (minDiscount > 0) {
      clauses.push({
        $expr: {
          $anyElementTrue: {
            $map: {
              input: "$packSizes",
              as: "pack",
              in: {
                $and: [
                  { $gt: ["$$pack.mrp", 0] },
                  {
                    $gte: [
                      { $multiply: [100, { $divide: [{ $subtract: ["$$pack.mrp", "$$pack.price"] }, "$$pack.mrp"] }] },
                      minDiscount,
                    ],
                  },
                ],
              },
            },
          },
        },
      });
    }
    if (featured) clauses.push({ featured: true });
    if (tag === "millet") {
      const milletCats = await Category.find({
        $or: [{ slug: "millet-cookies" }, { name: /millet/i }],
      }).lean();
      const ids = milletCats.map((c) => (c as { _id: unknown })._id);
      clauses.push({ $or: [
        { category: { $in: ids } },
        { name: /millet/i },
        { keywords: /millet/i },
      ] });
    } else if (tag === "pure-ghee") {
      clauses.push({ "badges.pureGhee": true });
    } else if (tag === "eggless") {
      clauses.push({ "badges.eggless": true });
    } else if (tag === "gifting") {
      // Festive-ready sweets: laddus, chikkis and cookies.
      const giftCats = await Category.find({
        slug: { $in: ["others", "chikkis", "cookies"] },
      }).lean();
      clauses.push({ category: {
        $in: giftCats.map((c) => (c as { _id: unknown })._id),
      } });
    }

    const filter = clauses.length === 1 ? clauses[0] : { $and: clauses };

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      featured: { featured: -1, totalSold: -1, createdAt: -1 },
      price_asc: { "packSizes.price": 1 },
      price_desc: { "packSizes.price": -1 },
      newest: { createdAt: -1 },
      best_selling: { totalSold: -1 },
      name_asc: { name: 1 },
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

    return NextResponse.json(
      {
        products: JSON.parse(JSON.stringify(products)),
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    console.error("products list error", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
