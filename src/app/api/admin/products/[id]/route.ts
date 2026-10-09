import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { productInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const product = await Product.findById(params.id).populate("category", "name slug").lean();
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product: JSON.parse(JSON.stringify(product)) });
  } catch (err) {
    console.error("get product error", err);
    return NextResponse.json({ error: "Failed to load product" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = productInputSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid product data" },
        { status: 400 }
      );
    }
    await connectDB();
    const product = await Product.findByIdAndUpdate(params.id, parsed.data, { new: true }).lean();
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ ok: true, product: JSON.parse(JSON.stringify(product)) });
  } catch (err) {
    console.error("update product error", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const product = await Product.findByIdAndDelete(params.id);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete product error", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
