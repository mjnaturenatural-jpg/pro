import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { ToastProvider } from "@/components/ui/Toast";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { APP_NAME, APP_URL } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models";
import { getPublishedCategories } from "@/lib/queries";

const inter = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
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
      "Shop premium natural foods from MJ Nature Natural — 100% eggless laddus, brownies, cookies and millet treats crafted with pure ghee, real butter and original jaggery — no maida, no refined sugar.",
    openGraph: {
      type: "website",
      siteName: brandName,
      url: APP_URL,
      images: [{ url: `${APP_URL}/og.jpg`, width: 1200, height: 630 }],
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
  let categories: { name: string; slug: string; image: string; description: string }[] = [];
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
    categories = (await getPublishedCategories()).map((c) => ({ name: c.name, slug: c.slug, image: c.image || "", description: c.description || "" }));
  } catch {
    // ignore
  }

  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: brandName,
                url: APP_URL,
                logo: logo || `${APP_URL}/images/logo.png`,
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: brandName,
                url: APP_URL,
                potentialAction: {
                  "@type": "SearchAction",
                  target: `${APP_URL}/shop?q={query}`,
                  "query-input": "required name=query",
                },
              },
            ]),
          }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brown-900 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <ToastProvider>
          <Header
            announcement={announcement}
            logo={logo}
            brandName={brandName}
            whatsapp={whatsapp}
            categories={categories}
          />
          <main id="main-content" className="flex-1 pb-16 lg:pb-0">{children}</main>
          <Footer />
          <BottomNav />
          <WhatsAppButton whatsapp={whatsapp} />
        </ToastProvider>
      </body>
    </html>
  );
}
