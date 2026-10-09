import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { categoryInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = categoryInputSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid category data" },
        { status: 400 }
      );
    }
    await connectDB();
    const category = await Category.findByIdAndUpdate(params.id, parsed.data, { new: true }).lean();
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    return NextResponse.json({ ok: true, category: JSON.parse(JSON.stringify(category)) });
  } catch (err) {
    console.error("update category error", err);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
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
    const { Product } = await import("@/models");
    const inUse = await Product.countDocuments({ category: params.id });
    if (inUse > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${inUse} product(s) still use this category` },
        { status: 400 }
      );
    }
    const category = await Category.findByIdAndDelete(params.id);
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete category error", err);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
