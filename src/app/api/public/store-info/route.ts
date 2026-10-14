import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models";

/** Public, safe-to-expose store facts (no secrets, no PII). */
export async function GET() {
  try {
    await connectDB();
    const s = (await SiteSettings.findOne({ key: "site" }).lean()) as unknown as {
      brandName?: string;
      foodLicence?: string;
    } | null;
    return NextResponse.json({
      brandName: s?.brandName || "MJ Nature Natural",
      foodLicence: s?.foodLicence || "",
    });
  } catch {
    return NextResponse.json({ brandName: "MJ Nature Natural", foodLicence: "" });
  }
}
