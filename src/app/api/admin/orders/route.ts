import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
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
    const status = searchParams.get("status") || "";
    const payment = searchParams.get("payment") || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Number(searchParams.get("limit") || 20));

    await connectDB();
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (payment) filter.paymentStatus = payment;
    if (q) {
      const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      filter.$or = [{ orderNumber: rx }, { "customer.name": rx }, { "customer.email": rx }, { "customer.phone": rx }];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json({
      orders: JSON.parse(JSON.stringify(orders)),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("admin orders error", err);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
