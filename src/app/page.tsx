import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf, Heart, Sparkles, Truck, Package, ChefHat, BadgeCheck, Star } from "lucide-react";
import { getFeaturedProducts, getHomepageContent, getPublishedCategories, getProductsBySlugs, getSettings } from "@/lib/queries";
import { ProductCard } from "@/components/product/ProductCard";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { BrandVideoSection } from "@/components/home/BrandVideoSection";
export const revalidate = 60;

const ICONS = [Leaf, Heart, Sparkles, Truck];

const ICON_COLORS = [
  "bg-leaf-100 text-leaf-700",
  "bg-berry-100 text-berry-600",
  "bg-honey-100 text-honey-600",
  "bg-caramel-100 text-caramel-600",
];

const STEP_COLORS = [
  "text-caramel-600/90",
  "text-leaf-600/90",
  "text-honey-600/90",
  "text-berry-500/90",
];

const CAT_ACCENTS = [
  "border-b-leaf-500",
  "border-b-caramel-500",
  "border-b-honey-500",
  "border-b-berry-500",
];

export default async function HomePage() {
  const [content, categories, featured, settings] = await Promise.all([
    getHomepageContent(),
    getPublishedCategories(),
    getFeaturedProducts(8),
    getSettings(),
  ]);

  const hero = (content?.hero ?? {}) as Record<string, string>;
  const story = (content?.story ?? {}) as Record<string, string>;
  const highlight = (content?.highlight ?? {}) as Record<string, string>;
  const trustPoints = (content?.trustPoints ?? []) as { title: string; description: string }[];
  const whyPoints = (content?.whyPoints ?? []) as { title: string; description: string }[];
  const featuredSlugs = (content?.featuredProductSlugs ?? []) as string[];
  const spotlightProducts =
    featuredSlugs.length > 0 ? await getProductsBySlugs(featuredSlugs) : featured.slice(0, 4);
  const highlightSlug = highlight.productSlug || "";
  const headline = hero.headline || "Naturally made. Thoughtfully crafted.";
  const hMatch = headline.match(/^([^,.:;]+)([,.:;]\s*)([\s\S]*)$/);
  const hMain = hMatch ? hMatch[1] + hMatch[2] : headline;
  const hRest = hMatch ? hMatch[3] : "";
  const highlightProduct =
    (highlightSlug ? featured.find((p) => p.slug === highlightSlug) : undefined) ??
    (highlightSlug ? (await getProductsBySlugs([highlightSlug]))[0] : undefined);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ivory-50">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-caramel-100/70 blur-3xl" />
          <div className="absolute right-0 top-16 h-[28rem] w-[28rem] rounded-full bg-honey-100/60 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-leaf-100/50 blur-3xl" />
        </div>
        <div className="container-site relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div className="animate-fadeUp">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-ivory-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-caramel-700 shadow-sm ring-1 ring-caramel-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-caramel-500 to-honey-400" />
              {hero.eyebrow || "MJ NATURE NATURAL"}
            </p>
            <h1 className="font-serif text-4xl leading-[1.08] text-bark-900 sm:text-5xl lg:text-6xl">
              {hMain}
              {hRest && <em className="italic text-caramel-600">{hRest}</em>}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-bark-600 sm:text-lg">
              {hero.subheading ||
                "Crafted with pure ghee, real butter and original jaggery — 100% eggless, no maida, no added sugar. Natural foods for everyday moments that deserve a little more care."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={hero.ctaHref || "/shop"} className="btn-primary">
                {hero.ctaText || "Shop Now"} <ArrowRight size={16} />
              </Link>
              <Link href={hero.secondaryCtaHref || "/shop"} className="btn-secondary">
                {hero.secondaryCtaText || "Explore Our Products"}
              </Link>
            </div>
            <p className="mt-6 text-sm font-bold text-leaf-700">
              100% Eggless &nbsp;•&nbsp; No Maida &nbsp;•&nbsp; No Added Sugar
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2.5 text-xs font-medium text-bark-600">
              <li className="flex items-center gap-1.5">
                <Leaf size={14} className="text-leaf-600" /> Small-batch kitchen
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-caramel-500" /> Packed fresh
              </li>
              <li className="flex items-center gap-1.5">
                <Truck size={14} className="text-leaf-600" /> Ships across India
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rounded-[40px] bg-gradient-to-br from-honey-200/70 via-caramel-100/50 to-leaf-100/70" />
            <div className="relative aspect-square overflow-hidden rounded-[32px] bg-sand-100 shadow-lift ring-1 ring-white/60">
              {hero.image ? (
                <Image
                  src={hero.image}
                  alt={hero.headline || "MJ Nature Natural"}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <HeroFallbackArt />
              )}
            </div>
            <div className="absolute -left-3 top-8 z-10 flex items-center gap-1.5 rounded-full bg-ivory-100/95 px-4 py-2 text-xs font-bold text-leaf-700 shadow-lift ring-1 ring-leaf-500/20 backdrop-blur sm:-left-6">
              <BadgeCheck size={15} /> 100% Eggless
            </div>
            <div className="absolute -bottom-5 right-4 z-10 w-48 rounded-2xl bg-ivory-100/95 p-4 shadow-lift ring-1 ring-honey-300/40 backdrop-blur sm:-right-4">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} size={12} className="fill-honey-400 text-honey-400" />
                ))}
              </div>
              <p className="mt-1.5 font-serif text-sm italic leading-snug text-bark-800">
                Fresh from our kitchen
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-bark-500">
                Pure ghee • Real jaggery
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CLAIMS MARQUEE */}
      <div className="overflow-hidden bg-bark-900 py-3.5">
        <div className="animate-marquee flex w-max whitespace-nowrap">
          {[0, 1].map((n) => (
            <div key={n} className="flex shrink-0 items-center" aria-hidden={n === 1}>
              {["Pure Ghee", "No Maida", "No Added Sugar", "100% Eggless", "Original Jaggery", "Small-Batch Kitchen"].map(
                (c) => (
                  <span
                    key={c}
                    className="px-6 text-xs font-bold uppercase tracking-[0.2em] text-ivory-50"
                  >
                    {c} <span className="pl-12 text-caramel-400">✦</span>
                  </span>
                )
              )}
            </div>
          ))}
        </div>
      </div>

      {/* BRAND VIDEO (renders only when a video URL is configured) */}
      <BrandVideoSection
        src={(settings.brandVideoUrl as string) || ""}
        poster={(settings.brandVideoPoster as string) || (hero.image as string) || ""}
        title="A Look Inside Our Kitchen"
        body="See how our small-batch treats are made with pure ghee, real butter and original jaggery."
      />

      {/* TRUST STRIP */}
      {trustPoints.length > 0 && (
        <section className="bg-ivory-50">
          <div className="container-site py-10">
            <div className="grid grid-cols-2 gap-6 rounded-2xl border border-bark-800/10 bg-ivory-100 px-6 py-8 shadow-soft lg:grid-cols-4">
            {trustPoints.slice(0, 4).map((t, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <div key={t.title} className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${ICON_COLORS[i % ICON_COLORS.length]}`}
                  >
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-bark-900">{t.title}</h3>
                    {t.description && (
                      <p className="mt-0.5 text-xs leading-relaxed text-bark-500">{t.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      <section className="container-site py-16 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Bestsellers</p>
            <h2 className="section-title">Shop Our Bestsellers</h2>
          </div>
          <Link href="/shop" className="hidden items-center gap-1 text-sm font-medium text-caramel-600 hover:text-caramel-700 sm:flex">
            View all <ArrowRight size={15} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {spotlightProducts.map((p, i) => (
            <ProductCard key={p._id} product={p} priority={i < 2} />
          ))}
        </div>
        <div className="mt-8 flex justify-center sm:hidden">
          <Link href="/shop" className="btn-secondary">
            View All Products <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="bg-cream py-16 sm:py-20">
          <div className="container-site">
            <div className="mb-8 text-center">
              <p className="eyebrow mb-2">Browse</p>
              <h2 className="section-title">Shop by Category</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {categories.map((c, i) => (
                <Link
                  key={c.slug}
                  href={`/shop?category=${c.slug}`}
                  className={`group relative overflow-hidden rounded-2xl border border-bark-800/10 border-b-4 ${CAT_ACCENTS[i % CAT_ACCENTS.length]} bg-ivory-100 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-2 hover:ring-honey-300/60`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-sand-50">
                    {c.image ? (
                      <Image
                        src={c.image}
                        alt={c.name}
                        fill
                        sizes="(max-width: 640px) 50vw, 20vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <CategoryFallbackArt name={c.name} />
                    )}
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="text-sm font-semibold text-bark-900">{c.name}</h3>
                    {c.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-bark-500">{c.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BRAND STORY */}
      <section className="container-site py-16 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative order-2 lg:order-1">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand-100 shadow-lift">
              {story.image ? (
                <Image
                  src={story.image}
                  alt={story.title || "Our story"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <StoryFallbackArt />
              )}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="eyebrow mb-3">Our Story</p>
            <h2 className="section-title">{story.title || "Rooted in nature, made with care"}</h2>
            <p className="mt-5 text-base leading-relaxed text-bark-600">
              {story.body ||
                "MJ Nature Natural is a premium natural food brand crafting wholesome treats from thoughtfully selected ingredients."}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-bark-800/10 pt-6 sm:grid-cols-4">
              {[
                { n: "32+", l: "Natural Products" },
                { n: "8", l: "Categories" },
                { n: "100%", l: "Eggless" },
                { n: "0%", l: "Maida" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="font-serif text-3xl font-semibold text-bark-900">{s.n}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-bark-500">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
            <Link href={story.ctaHref || "/about"} className="btn-secondary mt-7 inline-flex">
              {story.ctaText || "Discover Our Story"} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* OUR PROCESS */}
      <section className="bg-cream py-16 sm:py-20">
        <div className="container-site">
          <div className="mb-10 text-center">
            <p className="eyebrow mb-2 text-forest-900">Our Process</p>
            <h2 className="section-title">How We Work</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-bark-600">
              Every order follows the same careful path — no shortcuts, no long warehouse waits.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                Icon: Leaf,
                title: "Ingredients Selected",
                body: "We start with ingredients we would happily use at home — pure ghee, real butter, original jaggery, millets and spices chosen for quality.",
              },
              {
                step: "02",
                Icon: ChefHat,
                title: "Made in Small Batches",
                body: "Each batch is prepared and cooked in our kitchen with attention to texture, taste and consistency.",
              },
              {
                step: "03",
                Icon: Package,
                title: "Packed Fresh",
                body: "Products are packed close to dispatch in food-safe packaging so freshness travels well to you.",
              },
              {
                step: "04",
                Icon: Truck,
                title: "Delivered With Care",
                body: "Orders are shipped to your doorstep with tracking, and we are here if you need anything after delivery.",
              },
            ].map(({ step, Icon, title, body }, i) => (
              <div key={step} className="card relative p-6">
                <span
                  className={`absolute right-5 top-5 font-serif text-2xl font-semibold ${STEP_COLORS[i % STEP_COLORS.length]}`}
                >
                  {step}
                </span>
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-leaf-600 text-white">
                  <Icon size={19} />
                </span>
                <h3 className="text-sm font-semibold text-bark-900">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-bark-500">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link href="/about" className="btn-secondary">
              Discover Our Story <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* PRODUCT HIGHLIGHT */}
      <section className="bg-forest-800 py-12 sm:py-16">
        <div className="container-site grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-caramel-400">
              Spotlight
            </p>
            <h2 className="font-serif text-2xl leading-tight text-white sm:text-3xl">
              {highlight.title || "Made for everyday indulgence"}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80">
              {highlight.body ||
                "From soft jaggery laddus to rich millet cookies, our range is designed for the moments you want to slow down and savour."}
            </p>
            {highlightProduct && (
              <Link
                href={`/product/${highlightProduct.slug}`}
                className="btn mt-6 bg-ivory-50 px-5 py-2.5 text-sm text-bark-800 hover:bg-ivory-100"
              >
                {highlight.ctaText || "Explore Product"} <ArrowRight size={15} />
              </Link>
            )}
          </div>
          <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl bg-leaf-100">
            {highlight.image ? (
              <Image
                src={highlight.image}
                alt={highlight.title || "Product spotlight"}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : highlightProduct?.images[0] ? (
              <Image
                src={highlightProduct.images[0]}
                alt={highlightProduct.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <HighlightFallbackArt />
            )}
          </div>
        </div>
      </section>

      {/* PROMISE PANEL */}
      <section className="container-site py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-[30px] bg-forest-800 px-6 py-12 sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-honey-300/20" />
          <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-caramel-500/20" />
          <div className="relative mx-auto max-w-2xl text-center">
            <p className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-honey-200">
              Our Promise
            </p>
            <h2 className="font-serif text-3xl leading-tight text-white sm:text-4xl">
              No shortcuts. Just real ingredients.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/75">
              If we would not serve it to our own family, we will not pack it for yours. Every
              recipe is held to three rules — pure ghee and real butter, original jaggery, and
              nothing artificial.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs font-semibold uppercase tracking-wider text-honey-200">
              <span>Pure Ghee</span>
              <span>Original Jaggery</span>
              <span>Nothing Artificial</span>
            </div>
            <Link
              href="/shop"
              className="btn mt-8 bg-honey-300 px-7 py-3 text-sm font-semibold text-forest-900 hover:bg-honey-200"
            >
              Shop the Kitchen <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* WHY MJ */}
      {whyPoints.length > 0 && (
        <section className="container-site py-16 sm:py-24">
          <div className="mb-10 text-center">
            <p className="eyebrow mb-2">Why Us</p>
            <h2 className="section-title">Why MJ Nature Natural</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whyPoints.slice(0, 4).map((w, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <div key={w.title} className="card p-6 text-center">
                  <span
                    className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${ICON_COLORS[i % ICON_COLORS.length]}`}
                  >
                    <Icon size={20} />
                  </span>
                  <h3 className="text-sm font-semibold text-bark-900">{w.title}</h3>
                  {w.description && (
                    <p className="mt-2 text-xs leading-relaxed text-bark-500">{w.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* MORE PRODUCTS */}
      {featured.length > 4 && (
        <section className="bg-cream py-16 sm:py-20">
          <div className="container-site">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="eyebrow mb-2">More to Explore</p>
                <h2 className="section-title">More From Our Kitchen</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {featured.slice(4, 8).map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <TestimonialsSection
        testimonials={(content?.testimonials ?? []) as { name: string; quote: string; location?: string; rating?: number }[]}
        enabled={Boolean(content?.testimonialsEnabled)}
      />

      <NewsletterSection
        newsletter={(content?.newsletter ?? {}) as { title?: string; body?: string; enabled?: boolean }}
        instagramUrl={(content?.instagramUrl as string) || ""}
      />
    </>
  );
}

function HeroFallbackArt() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-sand-100 to-ivory-200 p-8 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-leaf-600 font-serif text-2xl font-semibold text-white">
        MJ
      </span>
      <p className="mt-6 font-serif text-2xl text-bark-800">Nature Natural</p>
      <p className="mt-2 text-sm text-bark-500">Premium natural foods</p>
    </div>
  );
}

function CategoryFallbackArt({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sand-100 to-ivory-200">
      <span className="font-serif text-lg text-bark-600">{name}</span>
    </div>
  );
}

function StoryFallbackArt() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-leaf-100 to-sand-100">
      <Leaf size={48} className="text-leaf-500" />
    </div>
  );
}

function HighlightFallbackArt() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-leaf-100">
      <Sparkles size={48} className="text-caramel-600" />
    </div>
  );
}
