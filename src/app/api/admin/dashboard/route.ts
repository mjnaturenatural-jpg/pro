import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order, Product, User, Category, Coupon, Review } from "@/models";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const [totalOrders, paidOrders, pendingOrders, totalProducts, totalCustomers, totalCategories] =
      await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ paymentStatus: "PAID" }),
        Order.countDocuments({ paymentStatus: "PENDING" }),
        Product.countDocuments(),
        User.countDocuments({ role: "CUSTOMER" }),
        Category.countDocuments(),
      ]);

    const revenueAgg = await Order.aggregate([
      { $match: { paymentStatus: "PAID" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const revenue = revenueAgg[0]?.total || 0;

    // low stock: any pack size with stock <= 5
    const lowStock = await Product.find({ published: true })
      .select("name slug packSizes images")
      .limit(20)
      .lean();
    const lowStockItems = lowStock
      .map((p) => {
        const prod = p as unknown as {
          _id: string;
          name: string;
          slug: string;
          images: string[];
          packSizes: { label: string; stock: number }[];
        };
        const low = prod.packSizes.filter((ps) => ps.stock <= 5);
        return low.length
          ? {
              productId: prod._id,
              name: prod.name,
              slug: prod.slug,
              image: prod.images[0] || "",
              packSizes: low,
            }
          : null;
      })
      .filter(Boolean);

    // revenue last 30 days by day
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const revenueByDay = await Order.aggregate([
      { $match: { paymentStatus: "PAID", createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 as const } },
    ]);

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(8).lean();
    const recentCustomers = await User.find({ role: "CUSTOMER" })
      .sort({ createdAt: -1 })
      .limit(6)
      .select("name email createdAt")
      .lean();
    const topProducts = await Product.find()
      .sort({ totalSold: -1 })
      .limit(6)
      .select("name totalSold images packSizes.price")
      .lean();

    const pendingReviews = await Review.countDocuments({ approved: false });

    return NextResponse.json({
      stats: {
        totalOrders,
        revenue,
        paidOrders,
        pendingOrders,
        totalProducts,
        totalCustomers,
        totalCategories,
        lowStockCount: lowStockItems.length,
        pendingReviews,
      },
      revenueByDay,
      recentOrders: JSON.parse(JSON.stringify(recentOrders)),
      recentCustomers: JSON.parse(JSON.stringify(recentCustomers)),
      topProducts: JSON.parse(JSON.stringify(topProducts)),
      lowStockItems: JSON.parse(JSON.stringify(lowStockItems)),
    });
  } catch (err) {
    console.error("dashboard error", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
