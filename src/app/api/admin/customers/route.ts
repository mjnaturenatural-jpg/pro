import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, Order } from "@/models";
import { requireAdmin } from "@/lib/auth";

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
    const filter: Record<string, unknown> = { role: "CUSTOMER" };
    if (q) {
      const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("name email phone createdAt")
        .lean(),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((u) => (u as { _id: unknown })._id);
    const orderStats = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $group: {
          _id: "$user",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$total" },
          lastOrder: { $max: "$createdAt" },
        },
      },
    ]);
    const statsMap = new Map(orderStats.map((s) => [s._id.toString(), s]));

    return NextResponse.json({
      customers: users.map((u) => {
        const uu = u as unknown as {
          _id: { toString(): string };
          name: string;
          email: string;
          phone: string;
          createdAt: string;
        };
        const s = statsMap.get(uu._id.toString());
        return {
          id: uu._id,
          name: uu.name,
          email: uu.email,
          phone: uu.phone,
          createdAt: uu.createdAt,
          orderCount: s?.orderCount || 0,
          totalSpent: s?.totalSpent || 0,
          lastOrder: s?.lastOrder || null,
        };
      }),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("admin customers error", err);
    return NextResponse.json({ error: "Failed to load customers" }, { status: 500 });
  }
}
