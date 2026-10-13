import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastProvider } from "@/components/ui/Toast";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { APP_NAME, APP_URL } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models";
import { getPublishedCategories } from "@/lib/queries";

const inter = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const viewport: Viewport = {
  themeColor: "#FDFAF5",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  let brandName = APP_NAME;
  let logo = "";
  try {
    await connectDB();
    const s = await SiteSettings.findOne({ key: "site" }).lean();
    if (s) {
      const st = s as unknown as { brandName: string; logo: string };
      if (st.brandName) brandName = st.brandName;
      if (st.logo) logo = st.logo;
    }
  } catch {
    // DB may be unavailable during build of static assets
  }
  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: `${brandName} — Premium Natural Foods`,
      template: `%s | ${brandName}`,
    },
    description:
      "Shop premium natural foods from MJ Nature Naturals — 100% eggless laddus, brownies, cookies and millet treats crafted with pure ghee, real butter and original jaggery — no maida, no added sugar.",
    openGraph: {
      type: "website",
      siteName: brandName,
      url: APP_URL,
      ...(logo ? { images: [{ url: logo }] } : {}),
    },
    twitter: { card: "summary_large_image" },
    alternates: { canonical: APP_URL },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let announcement = { enabled: false, text: "" };
  let logo = "";
  let brandName = APP_NAME;
  let whatsapp = "";
  let categories: { name: string; slug: string }[] = [];
  try {
    await connectDB();
    const s = await SiteSettings.findOne({ key: "site" }).lean();
    if (s) {
      const st = s as unknown as {
        announcementEnabled: boolean;
        announcementText: string;
        logo: string;
        brandName: string;
        whatsapp: string;
      };
      announcement = { enabled: st.announcementEnabled, text: st.announcementText };
      logo = st.logo || "";
      brandName = st.brandName || APP_NAME;
      whatsapp = st.whatsapp || "";
    }
    categories = (await getPublishedCategories()).map((c) => ({ name: c.name, slug: c.slug }));
  } catch {
    // ignore
  }

  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen flex flex-col">
        <ToastProvider>
          <Header
            announcement={announcement}
            logo={logo}
            brandName={brandName}
            whatsapp={whatsapp}
            categories={categories}
          />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton whatsapp={whatsapp} />
        </ToastProvider>
      </body>
    </html>
  );
}
