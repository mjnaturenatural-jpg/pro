import { guardAdmin } from "@/lib/admin-guard";
import { SettingsManager } from "@/components/admin/SettingsManager";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { isDeliveryShipReady } from "@/lib/delhivery";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models";

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
    await connectDB();
    settings = ((await SiteSettings.findOne({ key: "site" }).lean()) || {}) as Record<string, unknown>;
  } catch {
    // The manager remains usable with defaults when settings are not available.
  }

  return <SettingsManager initial={settings} integrations={integrations} />;
}
