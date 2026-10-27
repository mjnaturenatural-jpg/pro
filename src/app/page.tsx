import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Gift, Heart, Leaf, Sparkles, Truck } from "lucide-react";
import { getFeaturedProducts, getHomepageContent, getPublishedCategories, getProductsBySlugs, getSettings, getCategoryCounts } from "@/lib/queries";
import { Hero } from "@/components/home/Hero";
import { TrustMarquee } from "@/components/home/TrustMarquee";
import { Bestsellers } from "@/components/home/Bestsellers";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { StorySection } from "@/components/home/StorySection";
import { Timeline } from "@/components/home/Timeline";
import { FaqSection } from "@/components/home/FaqSection";
import { BrandVideoSection } from "@/components/home/BrandVideoSection";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { formatPrice } from "@/lib/format";
import { getWhatsAppLink, hamperEnquiryMessage } from "@/lib/whatsapp";
import { reviewSummary, REVIEWS } from "@data/reviews";
import { APP_URL } from "@/lib/constants";
import { ProductImage } from "@/components/product/ProductImage";
import type { Metadata } from "next";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "MJ Nature Natural — Premium Natural Foods",
  description:
    "Shop 100% eggless laddus, millet cookies, chikkis, brownies and jaggery treats made with pure ghee, real butter and original jaggery — no maida, no refined sugar.",
  alternates: { canonical: APP_URL },
  openGraph: {
    title: "MJ Nature Natural — Premium Natural Foods",
    description:
      "100% eggless, no maida, no refined sugar. Small-batch natural foods delivered across India.",
    url: APP_URL,
    images: [{ url: `${APP_URL}/og.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: [`${APP_URL}/og.jpg`],
  },
};

const ReviewsSection = dynamic(
  () => import("@/components/home/ReviewsSection").then((m) => m.ReviewsSection),
  {
    loading: () => (
      <div className="container-site py-16">
        <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-bark-800/10" />
      </div>
    ),
  }
);

const ICONS = [Leaf, Heart, Sparkles, Truck];

const ICON_COLORS = [
  "bg-leaf-100 text-leaf-700",
  "bg-berry-100 text-berry-600",
  "bg-honey-100 text-honey-600",
  "bg-caramel-100 text-caramel-700",
];

export default async function HomePage() {
  const [content, categories, pool, settings, counts] = await Promise.all([
    getHomepageContent(),
    getPublishedCategories(),
    getFeaturedProducts(24),
    getSettings(),
    getCategoryCounts(),
  ]);

  const hero = (content?.hero ?? {}) as Record<string, string>;
  const story = (content?.story ?? {}) as Record<string, string>;
  const highlight = (content?.highlight ?? {}) as Record<string, string>;
  const whyPoints = (content?.whyPoints ?? []) as { title: string; description: string }[];
  const highlightSlug = highlight.productSlug || "";
  const highlightProduct =
    (highlightSlug ? pool.find((p) => p.slug === highlightSlug) : undefined) ??
    (highlightSlug ? (await getProductsBySlugs([highlightSlug]))[0] : undefined);

  const summary = reviewSummary();
  const reviewerInitials = REVIEWS.map((r) => r.name.charAt(0).toUpperCase());

  const tiles = categories.map((c) => ({
    name: c.name,
    slug: c.slug,
    description: c.description || "",
    image: c.image || "",
    count: counts[c.slug] || 0,
  }));

  const totalProducts = Object.values(counts).reduce((n, c) => n + c, 0);
  const stats = [
    { value: totalProducts, suffix: "+", label: "Natural Products" },
    { value: categories.length, suffix: "", label: "Categories" },
    { value: 100, suffix: "%", label: "Eggless" },
    { value: 0, suffix: "%", label: "Maida" },
  ];

  const waNumber = (settings.whatsapp as string) || "";
  const hamperHref = getWhatsAppLink(hamperEnquiryMessage(), waNumber || undefined);
  const instagramUrl = (settings.instagram as string) || "";
  const googleReviewsUrl = "";
  const instaShots = pool.filter((p) => p.images[0]).slice(0, 6);

  const spotPacks = highlightProduct?.packSizes || [];
  const spotMin = spotPacks.length
    ? spotPacks.reduce((a, b) => (b.price < a.price ? b : a))
    : null;

  return (
    <>
      <Hero
        hero={hero}
        rating={summary.average}
        reviewCount={summary.total}
        reviewerInitials={reviewerInitials}
      />

      <TrustMarquee />

      <Bestsellers products={JSON.parse(JSON.stringify(pool.slice(0, 24)))} />

      <CategoryTiles categories={tiles} />

      {/* BRAND VIDEO (renders only when a video URL is configured) */}
      <BrandVideoSection
        src={(settings.brandVideoUrl as string) || ""}
        poster={(settings.brandVideoPoster as string) || (hero.image as string) || ""}
        title="A Look Inside Our Kitchen"
        body="See how our small-batch treats are made with pure ghee, real butter and original jaggery."
      />

      <StorySection story={story} stats={stats} />

      <Timeline />

      {/* SPOTLIGHT */}
      <section className="bg-brown-900 py-16 sm:py-20">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <p className="mb-3 inline-flex rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-turmeric-300 ring-1 ring-white/15">
              Spotlight
            </p>
            <h2 className="font-serif text-3xl font-bold leading-tight text-ivory-50 sm:text-4xl">
              {highlight.title || "Made for everyday indulgence"}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-ivory-50/75 sm:text-base">
              {highlight.body ||
                "From soft jaggery laddus to rich millet cookies, our range is designed for the moments you want to slow down and savour."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Pure Ghee", "Original Jaggery", "100% Eggless"].map((chip) => (
                <span key={chip} className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ivory-50/85 ring-1 ring-white/15">
                  {chip}
                </span>
              ))}
            </div>
            {spotMin && (
              <p className="mt-5 flex items-baseline gap-2.5">
                <span className="font-serif text-3xl font-bold text-turmeric-300">
                  {formatPrice(spotMin.price)}
                </span>
                {spotMin.mrp > spotMin.price && (
                  <span className="text-sm text-ivory-50/60 line-through">
                    {formatPrice(spotMin.mrp)}
                  </span>
                )}
              </p>
            )}
            {highlightProduct && (
              <Link
                href={`/product/${highlightProduct.slug}`}
                className="btn mt-7 bg-gradient-to-r from-turmeric-500 to-turmeric-400 px-7 py-3 text-sm font-bold text-brown-900 shadow-lg shadow-turmeric-500/25 transition hover:-translate-y-0.5"
              >
                {highlight.ctaText || "Explore Product"} <ArrowRight size={15} />
              </Link>
            )}
          </Reveal>
          <Reveal delay={0.12}>
            <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-lift ring-1 ring-white/20">
              {highlight.image ? (
                <ProductImage
                  src={highlight.image}
                  slug={highlightProduct?.slug}
                  alt={highlight.title || "Product spotlight"}
                  sizes="(max-width: 1024px) 92vw, 448px"
                  priority
                />
              ) : highlightProduct?.images[0] ? (
                <ProductImage
                  src={highlightProduct.images[0]}
                  slug={highlightProduct.slug}
                  alt={highlightProduct.name}
                  sizes="(max-width: 1024px) 92vw, 448px"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-sand-100">
                  <Sparkles size={44} className="text-caramel-600" />
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* GIFTING */}
      {hamperHref && (
        <section className="container-site py-14 sm:py-16">
          <Reveal>
            <div className="grain relative overflow-hidden rounded-[30px] bg-gradient-to-r from-caramel-700 via-caramel-600 to-turmeric-500 px-6 py-10 sm:px-12">
              <Gift size={120} className="pointer-events-none absolute -right-6 -top-6 rotate-12 text-white/10" aria-hidden="true" />
              <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xl">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ivory-50/80">
                    Festive Gifting
                  </p>
                  <h2 className="mt-1 font-serif text-2xl font-bold text-white sm:text-3xl">
                    Gift hampers, curated for your occasion
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/85">
                    Weddings, festivals, corporate boxes — tell us the occasion and headcount, and
                    we will pack it beautifully.
                  </p>
                </div>
                <a
                  href={hamperHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-caramel-700 shadow-lg transition hover:-translate-y-0.5"
                >
                  Enquire on WhatsApp <ArrowRight size={15} />
                </a>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* WHY US */}
      {whyPoints.length > 0 && (
        <section className="container-site pb-16 sm:pb-24">
          <SectionHeader
            eyebrow="Why Us"
            title="Why MJ Nature Natural"
            subtitle="Four promises we keep in every single pack."
            align="center"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whyPoints.slice(0, 4).map((w, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <Reveal key={w.title} delay={Math.min(i * 0.07, 0.25)}>
                  <div className="h-full rounded-3xl border border-bark-800/10 bg-ivory-100 p-6 text-center shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift">
                    <span
                      className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${ICON_COLORS[i % ICON_COLORS.length]}`}
                    >
                      <Icon size={20} />
                    </span>
                    <h3 className="text-sm font-bold text-bark-900">{w.title}</h3>
                    {w.description && (
                      <p className="mt-2 text-xs leading-relaxed text-bark-500">{w.description}</p>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      <ReviewsSection instagramUrl={instagramUrl} googleReviewsUrl={googleReviewsUrl} />

      {/* INSTAGRAM */}
      {instagramUrl && instaShots.length > 0 && (
        <section className="container-site py-16 sm:py-20">
          <SectionHeader
            eyebrow="Follow Along"
            title="Follow Our Kitchen"
            subtitle="Fresh batches, behind-the-scenes and festive packing."
            align="center"
          />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
            {instaShots.map((p) => (
              <a
                key={p._id}
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`See ${p.name} on Instagram`}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-white"
              >
                <ProductImage
                  src={p.images[0]}
                  slug={p.slug}
                  alt={p.name}
                  sizes="(max-width: 640px) 30vw, 180px"
                />
              </a>
            ))}
          </div>
        </section>
      )}

      <FaqSection />
    </>
  );
}
