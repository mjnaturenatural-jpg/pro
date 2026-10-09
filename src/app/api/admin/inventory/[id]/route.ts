import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  packSize: z.string(),
  stock: z.number().min(0),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid stock update" }, { status: 400 });
    await connectDB();
    const product = await Product.findOneAndUpdate(
      { _id: params.id, "packSizes.label": parsed.data.packSize },
      { $set: { "packSizes.$.stock": parsed.data.stock } },
      { new: true }
    ).lean();
    if (!product) return NextResponse.json({ error: "Product or pack size not found" }, { status: 404 });
    return NextResponse.json({ ok: true, packSizes: (product as { packSizes: unknown[] }).packSizes });
  } catch (err) {
    console.error("inventory update error", err);
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
  }
}
