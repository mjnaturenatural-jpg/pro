import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { categoryInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const categories = await Category.find().sort({ order: 1, name: 1 }).lean();
    return NextResponse.json({ categories: JSON.parse(JSON.stringify(categories)) });
  } catch (err) {
    console.error("admin categories error", err);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = categoryInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid category data" },
        { status: 400 }
      );
    }
    await connectDB();
    const existing = await Category.findOne({ $or: [{ slug: parsed.data.slug }, { name: parsed.data.name }] });
    if (existing) {
      return NextResponse.json({ error: "A category with this name or slug already exists" }, { status: 409 });
    }
    const category = await Category.create(parsed.data);
    return NextResponse.json({ ok: true, category: JSON.parse(JSON.stringify(category)) });
  } catch (err) {
    console.error("create category error", err);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
