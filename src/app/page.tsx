import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf, Heart, Sparkles, Truck, Package, ChefHat } from "lucide-react";
import { getFeaturedProducts, getHomepageContent, getPublishedCategories, getProductsBySlugs } from "@/lib/queries";
import { ProductCard } from "@/components/product/ProductCard";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
export const revalidate = 60;

const ICONS = [Leaf, Heart, Sparkles, Truck];

const ICON_COLORS = [
  "bg-leaf-50 text-leaf-600",
  "bg-berry-100 text-berry-600",
  "bg-honey-100 text-honey-600",
  "bg-caramel-100 text-caramel-600",
];

const STEP_COLORS = [
  "text-caramel-400/90",
  "text-leaf-400/90",
  "text-honey-400/90",
  "text-berry-400/90",
];

const CAT_ACCENTS = [
  "border-b-leaf-500",
  "border-b-caramel-400",
  "border-b-honey-400",
  "border-b-berry-400",
];

export default async function HomePage() {
  const [content, categories, featured] = await Promise.all([
    getHomepageContent(),
    getPublishedCategories(),
    getFeaturedProducts(8),
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
  const highlightProduct =
    (highlightSlug ? featured.find((p) => p.slug === highlightSlug) : undefined) ??
    (highlightSlug ? (await getProductsBySlugs([highlightSlug]))[0] : undefined);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-forest-800 via-ivory-50 to-caramel-500/15">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-honey-500/10 via-transparent to-transparent" />
        <div className="container-site grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
          <div className="animate-fadeUp">
            <p className="eyebrow mb-4">{hero.eyebrow || "MJ NATURE NATURALS"}</p>
            <h1 className="font-serif text-4xl leading-[1.1] text-bark-900 sm:text-5xl lg:text-6xl">
              {hero.headline || "Naturally made. Thoughtfully crafted."}
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
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2.5 text-xs font-medium text-bark-600">
              <li className="flex items-center gap-1.5">
                <Leaf size={14} className="text-leaf-400" /> Small-batch kitchen
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-caramel-500" /> Packed fresh
              </li>
              <li className="flex items-center gap-1.5">
                <Truck size={14} className="text-leaf-400" /> Ships across India
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-sand-100 shadow-lift">
              {hero.image ? (
                <Image
                  src={hero.image}
                  alt={hero.headline || "MJ Nature Naturals"}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <HeroFallbackArt />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      {trustPoints.length > 0 && (
        <section className="border-y border-bark-800/10 bg-ivory-50">
          <div className="container-site grid grid-cols-2 gap-6 py-10 lg:grid-cols-4">
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
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      <section className="container-site py-16 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Our Favourites</p>
            <h2 className="section-title">Shop Our Favourites</h2>
          </div>
          <Link href="/shop" className="hidden items-center gap-1 text-sm font-medium text-caramel-400 hover:text-caramel-300 sm:flex">
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
                  className={`group relative overflow-hidden rounded-xl border border-bark-800/10 border-b-4 ${CAT_ACCENTS[i % CAT_ACCENTS.length]} bg-ivory-100 shadow-soft transition hover:shadow-lift`}
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
                "MJ Nature Naturals is a premium natural food brand crafting wholesome treats from thoughtfully selected ingredients."}
            </p>
            <Link href={story.ctaHref || "/about"} className="btn-secondary mt-7 inline-flex">
              {story.ctaText || "Discover Our Story"} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* OUR PROCESS */}
      <section className="bg-forest-800 py-16 sm:py-20">
        <div className="container-site">
          <div className="mb-10 text-center">
            <p className="eyebrow mb-2">How We Work</p>
            <h2 className="section-title">From Our Kitchen to Your Door</h2>
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
      <section className="bg-forest-800 py-16 sm:py-24">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-caramel-400">
              Spotlight
            </p>
            <h2 className="font-serif text-3xl leading-tight text-white sm:text-4xl">
              {highlight.title || "Made for everyday indulgence"}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80">
              {highlight.body ||
                "From soft jaggery laddus to rich millet cookies, our range is designed for the moments you want to slow down and savour."}
            </p>
            {highlightProduct && (
              <Link
                href={`/product/${highlightProduct.slug}`}
                className="btn mt-7 bg-ivory-50 px-6 py-3 text-bark-800 hover:bg-ivory-100"
              >
                {highlight.ctaText || "Explore Product"} <ArrowRight size={15} />
              </Link>
            )}
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-forest-700">
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

      {/* WHY MJ */}
      {whyPoints.length > 0 && (
        <section className="container-site py-16 sm:py-24">
          <div className="mb-10 text-center">
            <p className="eyebrow mb-2">Why Us</p>
            <h2 className="section-title">Why MJ Nature Naturals</h2>
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
      <p className="mt-6 font-serif text-2xl text-bark-800">Nature Naturals</p>
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
    <div className="flex h-full w-full items-center justify-center bg-forest-700">
      <Sparkles size={48} className="text-caramel-400" />
    </div>
  );
}
