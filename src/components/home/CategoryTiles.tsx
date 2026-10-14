import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";

export interface CategoryTile {
  name: string;
  slug: string;
  description: string;
  image: string;
  count: number;
}

export function CategoryTiles({ categories }: { categories: CategoryTile[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="bg-ivory-50 py-16 sm:py-20">
      <div className="container-site">
        <SectionHeader
          eyebrow="Browse"
          title="Shop by Category"
          subtitle="Eight little worlds of homemade taste — pick your craving."
          align="center"
        />
        <div className="grid auto-cols-[70%] grid-flow-col gap-4 overflow-x-auto pb-2 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
          {categories.map((c, i) => (
            <Reveal key={c.slug} delay={Math.min(i * 0.05, 0.3)}>
              <Link
                href={`/shop?category=${c.slug}`}
                className="group relative block snap-start overflow-hidden rounded-3xl border border-bark-800/10 bg-ivory-100 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-sand-100">
                  {c.image ? (
                    <Image
                      src={c.image}
                      alt={c.name}
                      fill
                      sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 22vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-serif text-lg text-bark-600">
                      {c.name}
                    </span>
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-brown-900/35 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" aria-hidden="true" />
                  <span className="absolute right-3 top-3 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-ivory-50 text-caramel-700 opacity-0 shadow-md transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <ArrowRight size={16} />
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-bark-900">{c.name}</h3>
                    <span className="shrink-0 rounded-full bg-sand-100 px-2 py-0.5 text-[11px] font-bold text-bark-600">
                      {c.count} item{c.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  {c.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-bark-500">{c.description}</p>
                  )}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
