import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Leaf, Sparkles, Truck } from "lucide-react";
import { Rating } from "@/components/ui/Rating";
import { Reveal } from "@/components/ui/Reveal";

interface HeroProps {
  hero: Record<string, string>;
  rating: number;
  reviewCount: number;
  reviewerInitials: string[];
  floaters: { src: string; alt: string }[];
}

export function Hero({ hero, rating, reviewCount, reviewerInitials, floaters }: HeroProps) {
  const headline = hero.headline || "Homemade goodness, delivered to your door.";
  const hMatch = headline.match(/^([^,.:;]+)([,.:;]\s*)([\s\S]*)$/);
  const hMain = hMatch ? hMatch[1] + hMatch[2] : headline;
  const hRest = hMatch ? hMatch[3] : "";

  return (
    <section className="grain relative overflow-hidden bg-ivory-50">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-caramel-100/70 blur-3xl" />
        <div className="absolute right-0 top-16 h-[28rem] w-[28rem] rounded-full bg-turmeric-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-leaf-100/60 blur-3xl" />
      </div>
      <div className="container-site relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <Reveal>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-ivory-100 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-caramel-700 shadow-sm ring-1 ring-caramel-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-caramel-500 to-turmeric-400" />
            {hero.eyebrow || "Pure Ghee • Original Jaggery • 100% Eggless"}
          </p>
          <h1 className="font-serif text-4xl font-bold leading-[1.06] text-brown-900 sm:text-5xl lg:text-6xl">
            {hMain}
            {hRest && <em className="italic text-caramel-600">{hRest}</em>}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-bark-600 sm:text-lg">
            {hero.subheading ||
              "Small-batch laddus, chikkis, cookies and brownies made with pure ghee, real butter and original jaggery."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={hero.ctaHref || "/shop"} className="btn-primary">
              {hero.ctaText || "Shop Bestsellers"} <ArrowRight size={16} />
            </Link>
            <Link href={hero.secondaryCtaHref || "/about"} className="btn-secondary">
              {hero.secondaryCtaText || "Our Story"}
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { Icon: Leaf, label: "No Maida" },
              { Icon: Sparkles, label: "No Refined Sugar" },
              { Icon: BadgeCheck, label: "Pure Ghee" },
            ].map(({ Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-bark-800/10 bg-ivory-100 px-3 py-1.5 text-xs font-bold text-bark-700 shadow-sm">
                <Icon size={13} className="text-leaf-600" /> {label}
              </span>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex -space-x-2" aria-hidden="true">
              {reviewerInitials.slice(0, 5).map((initial, i) => (
                <span
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-caramel-500 to-turmeric-400 font-serif text-sm font-bold text-white ring-2 ring-ivory-50"
                >
                  {initial}
                </span>
              ))}
            </div>
            <div>
              <Rating value={rating} size={13} />
              <p className="mt-0.5 text-xs font-semibold text-bark-600">
                {rating.toFixed(1)} loved across India · {reviewCount} reviews
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15} className="relative">
          <div className="relative mx-auto max-w-md lg:max-w-none">
            <div className="absolute -inset-3 rounded-[40px] bg-gradient-to-br from-turmeric-300/60 via-caramel-100/50 to-leaf-100/70" aria-hidden="true" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-b-[32px] rounded-t-[999px] bg-sand-100 shadow-lift ring-1 ring-white/60">
              {hero.image ? (
                <Image
                  src={hero.image}
                  alt={hero.headline || "MJ Nature Natural homemade foods"}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sand-100 to-ivory-200">
                  <span className="font-serif text-2xl text-bark-600">MJ Nature Natural</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-brown-900/25 via-transparent to-transparent" aria-hidden="true" />
            </div>
            {floaters.slice(0, 2).map((f, i) => (
              <div
                key={f.src}
                className={
                  i === 0
                    ? "animate-floaty absolute -left-4 top-16 h-24 w-24 overflow-hidden rounded-2xl bg-ivory-100 shadow-lift ring-1 ring-white/70 sm:-left-8 sm:h-28 sm:w-28"
                    : "animate-floaty absolute -right-3 top-1/2 h-20 w-20 overflow-hidden rounded-2xl bg-ivory-100 shadow-lift ring-1 ring-white/70 sm:-right-6 sm:h-24 sm:w-24 [animation-delay:1.2s]"
                }
              >
                <Image src={f.src} alt={f.alt} fill sizes="112px" className="object-cover" />
              </div>
            ))}
            <div className="absolute -left-3 bottom-24 z-10 flex items-center gap-1.5 rounded-full bg-ivory-100/95 px-4 py-2 text-xs font-bold text-leaf-700 shadow-lift ring-1 ring-leaf-500/20 backdrop-blur sm:-left-6">
              <BadgeCheck size={15} /> Small-batch fresh
            </div>
            <div className="absolute -bottom-5 right-4 z-10 w-48 rounded-2xl bg-ivory-100/95 p-4 shadow-lift ring-1 ring-turmeric-400/40 backdrop-blur sm:-right-4">
              <Rating value={rating} size={12} />
              <p className="mt-1.5 font-serif text-sm italic leading-snug text-bark-800">
                Fresh from our kitchen
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-bark-500">
                Pure ghee • Real jaggery
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
