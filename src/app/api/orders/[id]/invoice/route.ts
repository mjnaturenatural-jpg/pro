import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { getSession } from "@/lib/auth";
import { tokensMatch } from "@/lib/payments";
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

    // Guest access requires the order's private access token (not the
    // order number, which is shown in places that shouldn't grant full access).
    const token = new URL(req.url).searchParams.get("token");
    if (tokensMatch(token, (order as { accessToken?: string }).accessToken)) {
      return NextResponse.json({ order: JSON.parse(JSON.stringify(order)) });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch (err) {
    console.error("invoice order error", err);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}
