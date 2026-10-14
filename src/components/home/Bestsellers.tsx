"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tabs } from "@/components/ui/Tabs";

const TABS = [
  { value: "all", label: "All" },
  { value: "chikki", label: "Chikki" },
  { value: "cookies", label: "Cookies" },
  { value: "brownies", label: "Brownies" },
  { value: "laddus", label: "Laddus" },
];

function categorySlug(p: ProductCardData): string {
  return typeof p.category === "object" ? p.category?.slug || "" : "";
}

export function Bestsellers({ products }: { products: ProductCardData[] }) {
  const [tab, setTab] = useState("all");
  const filtered = useMemo(() => {
    const list = tab === "all" ? products : products.filter((p) => categorySlug(p) === tab);
    return list.slice(0, 8);
  }, [products, tab]);

  if (products.length === 0) return null;

  return (
    <section className="container-site py-16 sm:py-20">
      <SectionHeader
        eyebrow="Bestsellers"
        title="Shop Our Bestsellers"
        subtitle="The boxes that sell out first — loved by families across India."
        align="center"
      />
      <Tabs options={TABS} value={tab} onChange={setTab} ariaLabel="Filter bestsellers by category" />
      <div className="mt-8 overflow-hidden">
        <div key={tab} className="animate-shelf flex w-max gap-3 pr-3 sm:gap-5 sm:pr-5">
          {[...filtered, ...filtered].map((p, i) => (
            <div key={`${p._id}-${i}`} className="w-[68vw] max-w-[300px] shrink-0 sm:w-[280px]" aria-hidden={i >= filtered.length}>
              <ProductCard product={p} priority={i < 2} />
            </div>
          ))}
        </div>
      </div>
      {filtered.length === 0 && (
        <p className="mt-8 text-center text-sm text-bark-500">
          Nothing here yet — explore the full collection instead.
        </p>
      )}
      <div className="mt-10 flex justify-center">
        <Link href="/shop" className="btn-secondary">
          View All Products <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
