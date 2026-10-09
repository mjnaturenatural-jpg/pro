import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { getSession } from "@/lib/auth";
import { isAdminOrderOwned } from "./helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const order = await Order.findById(params.id).lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const session = await getSession();
    if (session?.user?.email) {
      const allowed = await isAdminOrderOwned(
        order,
        session.user.email,
        (session.user as { role?: string }).role
      );
      if (allowed) return NextResponse.json({ order: JSON.parse(JSON.stringify(order)) });
    }

    // Guest access: possession of the order number (shown on the confirmation page) acts as a receipt token
    const on = new URL(req.url).searchParams.get("on");
    if (on && on === (order as { orderNumber?: string }).orderNumber) {
      return NextResponse.json({ order: JSON.parse(JSON.stringify(order)) });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch (err) {
    console.error("invoice order error", err);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}
