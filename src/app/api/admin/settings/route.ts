import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  brandName: z.string().optional(),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  contactEmail: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  youtube: z.string().optional(),
  announcementText: z.string().optional(),
  announcementEnabled: z.boolean().optional(),
  freeShippingThreshold: z.number().min(0).optional(),
  flatShipping: z.number().min(0).optional(),
  taxRate: z.number().min(0).optional(),
  gstNumber: z.string().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    let s = await SiteSettings.findOne({ key: "site" }).lean();
    if (!s) s = await SiteSettings.create({ key: "site" });
    const st = s as unknown as Record<string, unknown>;
    // never expose secrets
    return NextResponse.json({
      settings: {
        brandName: st.brandName,
        logo: st.logo,
        favicon: st.favicon,
        contactEmail: st.contactEmail,
        phone: st.phone,
        whatsapp: st.whatsapp,
        address: st.address,
        instagram: st.instagram,
        facebook: st.facebook,
        youtube: st.youtube,
        announcementText: st.announcementText,
        announcementEnabled: st.announcementEnabled,
        freeShippingThreshold: st.freeShippingThreshold,
        flatShipping: st.flatShipping,
        taxRate: st.taxRate,
        gstNumber: st.gstNumber,
      },
      integrations: {
        razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
        delhivery: Boolean(process.env.DELHIVERY_API_KEY && process.env.DELHIVERY_CLIENT_CODE),
        cloudinary: Boolean(
          process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
        ),
      },
    });
  } catch (err) {
    console.error("admin settings error", err);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
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
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings data" }, { status: 400 });
    }
    await connectDB();
    const s = await SiteSettings.findOneAndUpdate(
      { key: "site" },
      { $set: parsed.data },
      { new: true, upsert: true }
    ).lean();
    return NextResponse.json({ ok: true, settings: JSON.parse(JSON.stringify(s)) });
  } catch (err) {
    console.error("update settings error", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
