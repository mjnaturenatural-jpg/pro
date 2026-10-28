import Image from "next/image";
import Link from "next/link";
import { Leaf, Heart, Sparkles, Truck, Quote, ShieldCheck } from "lucide-react";
import { getHomepageContent, getSettings } from "@/lib/queries";
import { Timeline } from "@/components/home/Timeline";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { siteConfig } from "@config/site";
import { Metadata } from "next";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about MJ Nature Natural — a premium natural food brand crafting 100% eggless laddus, brownies, cookies and millet treats with pure ghee, real butter and original jaggery — no maida, no refined sugar.",
};

const BRAND_PILLARS = [
  "Pure ghee & real butter",
  "100% eggless",
  "Original jaggery",
  "No maida, no refined sugar",
  "Small-batch craft",
];

export default async function AboutPage() {
  const [content, settings] = await Promise.all([getHomepageContent(), getSettings()]);
  const story = (content?.story ?? {}) as Record<string, string>;
  const whyPoints = (content?.whyPoints ?? []) as { title: string; description: string }[];
  const trustPoints = (content?.trustPoints ?? []) as { title: string; description: string }[];
  const brandName = (settings.brandName as string) || siteConfig.brandName;
  const foodLicence = (settings.foodLicence as string) || siteConfig.fssai;
  const founderName = siteConfig.founderName;
  const founderPhoto = siteConfig.founderPhoto;

  return (
    <div>
      <section className="grain bg-gradient-to-br from-ivory-100 via-cream to-sand-100 py-14 sm:py-20">
        <div className="container-site max-w-3xl">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
          <div className="text-center">
            <p className="eyebrow mb-3">About Us</p>
            <h1 className="font-serif text-4xl font-bold leading-tight text-brown-900 sm:text-5xl">
              {story.title || "Rooted in nature, made with care"}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-bark-600">
              {story.body ||
                `${brandName} is a premium natural food brand crafting wholesome treats from thoughtfully selected ingredients. Every batch is prepared with care, so what reaches your table feels honest, flavourful and familiar.`}
            </p>
            {foodLicence && (
              <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-leaf-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-leaf-700">
                <ShieldCheck size={14} /> FSSAI Lic. No. {foodLicence}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Brand story */}
      <section className="container-site py-16 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow mb-3">About the Brand</p>
            <h2 className="font-serif text-3xl font-bold leading-tight text-brown-900 sm:text-4xl">
              Real ingredients. Honest food.
            </h2>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-bark-600">
              <p>
                {brandName} was born from a simple idea: everyday snacks should be made
                from things you can recognise and pronounce. Everything is 100%
                eggless, with no maida, no refined sugar and no shortcuts — just wholesome
                millets, original jaggery, pure ghee, real butter and plenty of
                patience.
              </p>
              <p>
                From our laddus and cookies to our brownies, every recipe is developed
                in small batches and made the slow way. We mill, mix, roast and bake in
                quantities we can stand behind, so the flavour stays consistent and the
                ingredient list stays short.
              </p>
              <p>
                We are a young Indian food brand doing one thing with care: making
                treats that taste like they were made at home — because, in a way, they
                were.
              </p>
            </div>
            <ul className="mt-7 flex flex-wrap gap-2.5">
              {BRAND_PILLARS.map((p) => (
                <li
                  key={p}
                  className="rounded-full border border-leaf-200 bg-leaf-50 px-4 py-1.5 text-xs font-semibold text-leaf-700"
                >
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-sand-100 shadow-lift ring-1 ring-white/60">
            {story.image ? (
              <Image
                src={story.image}
                alt={brandName}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-leaf-100 to-ivory-100 text-leaf-600">
                <Leaf size={56} />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                  Made with care
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="bg-cream py-16 sm:py-20">
        <div className="container-site">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="relative order-2 aspect-[4/3] overflow-hidden rounded-[32px] bg-gradient-to-br from-sand-200 to-ivory-100 shadow-soft lg:order-1">
              {founderPhoto ? (
                <Image
                  src={founderPhoto}
                  alt={founderName || "Founder"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="text-center">
                    <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-ivory-100 font-serif text-2xl font-bold text-caramel-700 shadow-soft">
                      MJ
                    </span>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-bark-500">
                      {founderName || "Our Founder"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="order-1 lg:order-2">
              <p className="eyebrow mb-3">About the Founder</p>
              <h2 className="font-serif text-3xl font-bold leading-tight text-brown-900 sm:text-4xl">
                {founderName || "From a home kitchen, with love"}
              </h2>
              <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-bark-600">
                <p>
                  It started at a home kitchen counter, with a stack of family recipe
                  notebooks and a simple question: why should a quick snack mean
                  refined flour and refined sugar?
                </p>
                <p>
                  {founderName ? `${founderName} began` : "We began"} developing the
                  first {brandName} recipes for family and friends — swapping maida
                  for millets, white sugar for jaggery, and factory shortcuts for slow,
                  small-batch methods. The feedback was immediate: these tasted like
                  the treats remembered from childhood, only better made.
                </p>
                <p>
                  Today, every new recipe still passes the same test it did on day one
                  — it has to earn a place on the family table before it ever reaches
                  yours.
                </p>
              </div>
              <blockquote className="mt-7 border-l-2 border-caramel-500 pl-5">
                <Quote size={18} className="mb-2 text-caramel-500" />
                <p className="font-serif text-lg italic leading-relaxed text-bark-800">
                  “If I wouldn&rsquo;t serve it to my own family, it doesn&rsquo;t get
                  packaged.”
                </p>
                <cite className="mt-2 block text-xs font-semibold not-italic uppercase tracking-wide text-bark-500">
                  — {founderName || `Team ${brandName}`}
                </cite>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {(trustPoints.length > 0 || whyPoints.length > 0) && (
        <section className="bg-ivory-100 py-16 sm:py-20">
          <div className="container-site">
            <div className="mb-10 text-center">
              <p className="eyebrow mb-2">What We Stand For</p>
              <h2 className="font-serif text-3xl font-bold leading-tight text-brown-900 sm:text-4xl">
                Crafted with intention
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...trustPoints, ...whyPoints].slice(0, 8).map((p, i) => {
                const Icon = [Leaf, Heart, Sparkles, Truck][i % 4];
                return (
                  <div key={`${p.title}-${i}`} className="card p-6 text-center">
                    <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-leaf-50 text-leaf-600">
                      <Icon size={20} />
                    </span>
                    <h3 className="text-sm font-semibold text-bark-900">{p.title}</h3>
                    {p.description && (
                      <p className="mt-2 text-xs leading-relaxed text-bark-500">{p.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Timeline />

      <section className="container-site py-16 text-center sm:py-20">
        <h2 className="font-serif text-3xl font-bold text-brown-900 sm:text-4xl">
          Ready to taste the difference?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-bark-600">
          Explore our full range of laddus, brownies, cookies and millet treats.
        </p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">
          Shop Our Collection
        </Link>
      </section>
    </div>
  );
}
