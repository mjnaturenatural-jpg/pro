import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const limit = Math.min(Number(searchParams.get("limit") || 6), 20);
    if (q.trim().length < 2) {
      return NextResponse.json({ products: [] });
    }
    await connectDB();
    const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const products = await Product.find({
      published: true,
      $or: [{ name: regex }, { keywords: regex }],
    })
      .select("name slug images packSizes.price packSizes.mrp")
      .limit(limit)
      .lean();

    return NextResponse.json({
      products: products.map((p) => {
        const prod = p as unknown as {
          _id: string;
          name: string;
          slug: string;
          images: string[];
          packSizes: { price: number; mrp: number }[];
        };
        return {
          _id: prod._id,
          name: prod.name,
          slug: prod.slug,
          images: prod.images,
          price: prod.packSizes[0]?.price ?? 0,
          mrp: prod.packSizes[0]?.mrp ?? 0,
        };
      }),
    });
  } catch (err) {
    console.error("search error", err);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
