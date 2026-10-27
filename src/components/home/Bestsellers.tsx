"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tabs } from "@/components/ui/Tabs";

const TABS = [
  { value: "all", label: "All" },
  { value: "chikkis", label: "Chikkis" },
  { value: "cookies", label: "Cookies" },
  { value: "brownies", label: "Brownies" },
  { value: "others", label: "Others" },
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
      <div className="mt-8 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-5 lg:grid-cols-4">
        {filtered.map((p, i) => (
          <div key={p._id} className="min-w-0">
            <ProductCard product={p} priority={i < 4} />
          </div>
        ))}
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
