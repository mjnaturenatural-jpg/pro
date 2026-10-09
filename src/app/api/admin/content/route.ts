import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { HomepageContent } from "@/models";
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
    let c = await HomepageContent.findOne({ key: "homepage" }).lean();
    if (!c) c = await HomepageContent.create({ key: "homepage" });
    return NextResponse.json({ content: JSON.parse(JSON.stringify(c)) });
  } catch (err) {
    console.error("admin content error", err);
    return NextResponse.json({ error: "Failed to load content" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    await connectDB();
    const c = await HomepageContent.findOneAndUpdate(
      { key: "homepage" },
      { $set: body },
      { new: true, upsert: true }
    ).lean();
    return NextResponse.json({ ok: true, content: JSON.parse(JSON.stringify(c)) });
  } catch (err) {
    console.error("update content error", err);
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 });
  }
}
