import { guardAdmin } from "@/lib/admin-guard";
import { SettingsManager } from "@/components/admin/SettingsManager";
import { APP_URL } from "@/lib/constants";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { isDeliveryShipReady } from "@/lib/delhivery";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await guardAdmin("/admin/settings");

  // Read integration status without exposing secrets
  const integrations = {
    razorpay: isRazorpayConfigured(),
    delhivery: isDeliveryShipReady(),
    cloudinary: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
    ),
  };

  let settings: Record<string, unknown> = {};
  try {
    const res = await fetch(`${APP_URL}/api/admin/settings`, {
      cache: "no-store",
    });
    const data = await res.json();
    settings = data.settings || {};
  } catch {
    // fallback: fetch directly via DB
    const { connectDB } = await import("@/lib/db");
    const { SiteSettings } = await import("@/models");
    await connectDB();
    const s = (await SiteSettings.findOne({ key: "site" }).lean()) || {};
    settings = s as Record<string, unknown>;
  }

  return <SettingsManager initial={settings} integrations={integrations} />;
}
