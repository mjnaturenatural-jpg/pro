import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Leaf, Sparkles } from "lucide-react";
import { Rating } from "@/components/ui/Rating";
import { Reveal } from "@/components/ui/Reveal";

interface HeroProps {
  hero: Record<string, string>;
  rating: number;
  reviewCount: number;
  reviewerInitials: string[];
}

export function Hero({ hero, rating, reviewCount, reviewerInitials }: HeroProps) {
  const headline = hero.headline || "Homemade goodness, delivered to your door.";
  const hMatch = headline.match(/^([^,.:;]+)([,.:;]\s*)([\s\S]*)$/);
  const hMain = hMatch ? hMatch[1] + hMatch[2] : headline;
  const hRest = hMatch ? hMatch[3] : "";

  return (
    <section className="grain relative overflow-hidden bg-brown-900" aria-label="Featured">
      {hero.image ? (
        <Image
          src={hero.image}
          alt={hero.headline || "MJ Nature Natural homemade foods"}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-caramel-600/30 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-turmeric-400/20 blur-3xl" />
        </div>
      )}
      {/* Readability overlays — stronger at the bottom for mobile */}
      <div className="absolute inset-0 bg-gradient-to-r from-brown-900/95 via-brown-900/65 to-brown-900/15" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-brown-900/80 via-transparent to-brown-900/25" aria-hidden="true" />

      <div className="container-site relative flex min-h-[88svh] items-center py-16 sm:py-20 lg:min-h-[94vh]">
        <Reveal className="max-w-2xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-turmeric-300 ring-1 ring-white/20 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-caramel-400 to-turmeric-300" />
            {hero.eyebrow || "Pure Ghee • Original Jaggery • 100% Eggless"}
          </p>
          <h1 className="font-serif text-4xl font-bold leading-[1.06] text-ivory-50 sm:text-6xl lg:text-7xl">
            {hMain}
            {hRest && <em className="italic text-turmeric-300">{hRest}</em>}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ivory-50/85 sm:text-lg">
            {hero.subheading ||
              "Small-batch laddus, chikkis, cookies and brownies made with pure ghee, real butter and original jaggery."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={hero.ctaHref || "/shop"} className="btn-primary">
              {hero.ctaText || "Shop Bestsellers"} <ArrowRight size={16} />
            </Link>
            <Link
              href={hero.secondaryCtaHref || "/about"}
              className="btn min-h-[48px] border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
            >
              {hero.secondaryCtaText || "Our Story"}
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {[
              { Icon: Leaf, label: "No Maida" },
              { Icon: Sparkles, label: "No Refined Sugar" },
              { Icon: BadgeCheck, label: "Pure Ghee" },
            ].map(({ Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-ivory-50 ring-1 ring-white/15 backdrop-blur">
                <Icon size={13} className="text-turmeric-300" /> {label}
              </span>
            ))}
          </div>
          <div className="mt-7 flex items-center gap-3">
            <div className="flex -space-x-2" aria-hidden="true">
              {reviewerInitials.slice(0, 5).map((initial, i) => (
                <span
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-caramel-500 to-turmeric-400 font-serif text-sm font-bold text-white ring-2 ring-brown-900"
                >
                  {initial}
                </span>
              ))}
            </div>
            <div>
              <Rating value={rating} size={13} />
              <p className="mt-0.5 text-xs font-semibold text-ivory-50/80">
                {rating.toFixed(1)} loved across India · {reviewCount} reviews
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Floating badges */}
      <div className="absolute right-6 top-24 z-10 hidden items-center gap-1.5 rounded-full bg-ivory-50/95 px-4 py-2 text-xs font-bold text-leaf-700 shadow-lift backdrop-blur md:flex lg:right-12">
        <BadgeCheck size={15} /> Small-batch fresh
      </div>
      <div className="absolute bottom-24 right-6 z-10 hidden w-52 rounded-2xl bg-ivory-50/95 p-4 shadow-lift backdrop-blur md:block lg:right-12">
        <Rating value={rating} size={12} />
        <p className="mt-1.5 font-serif text-sm italic leading-snug text-bark-800">
          Fresh from our kitchen
        </p>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-bark-500">
          Pure ghee • Real jaggery
        </p>
      </div>
    </section>
  );
}
