import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";
import { Eyebrow } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/home/CountUp";

interface StorySectionProps {
  story: Record<string, string>;
  stats: { value: number; suffix: string; label: string }[];
}

export function StorySection({ story, stats }: StorySectionProps) {
  return (
    <section className="container-site py-16 sm:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal className="relative order-2 lg:order-1">
          <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-br from-sand-200/70 to-leaf-100/60" aria-hidden="true" />
          <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-sand-100 shadow-lift ring-1 ring-white/60">
            {story.image ? (
              <Image
                src={story.image}
                alt={story.title || "Our story"}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-leaf-100 to-sand-100">
                <Leaf size={48} className="text-leaf-500" />
              </div>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.1} className="order-1 lg:order-2">
          <Eyebrow>Our Story</Eyebrow>
          <h2 className="mt-2 font-serif text-3xl font-bold leading-tight text-brown-900 sm:text-4xl">
            {story.title || "Rooted in nature, made with care"}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-bark-600">
            {story.body ||
              "MJ Nature Natural is a premium natural food brand crafting wholesome treats from thoughtfully selected ingredients."}
          </p>
          <p className="mt-5 font-serif text-2xl italic text-caramel-700">
            Made with love, Team MJ
          </p>
          <div className="mt-8 grid grid-cols-2 gap-6 border-t border-bark-800/10 pt-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-serif text-3xl font-bold text-brown-900">
                  <CountUp to={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-bark-500">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          <Link href={story.ctaHref || "/about"} className="btn-secondary mt-7 inline-flex">
            {story.ctaText || "Read our full story"} <ArrowRight size={15} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
