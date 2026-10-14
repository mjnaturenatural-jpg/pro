"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, RotateCcw } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [suggestions, setSuggestions] = useState<ProductCardData[]>([]);

  useEffect(() => {
    fetch("/api/products?limit=4&featured=true")
      .then((r) => r.json())
      .then((d) => setSuggestions(d.products || []))
      .catch(() => setSuggestions([]));
  }, []);

  return (
    <div className="container-site py-16 text-center sm:py-24">
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-chilli-600/10 text-chilli-600">
        <AlertTriangle size={36} />
      </span>
      <p className="eyebrow mb-3 mt-6">Something went wrong</p>
      <h1 className="mx-auto max-w-lg font-serif text-3xl font-bold leading-tight text-brown-900 sm:text-4xl">
        Our kitchen dropped a tray — let&apos;s fix it
      </h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-bark-600">
        Please try again. If the problem continues, reach out and we will sort it out.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          <RotateCcw size={15} /> Try Again
        </button>
        <Link href="/shop" className="btn-secondary">
          Shop Bestsellers <ArrowRight size={15} />
        </Link>
      </div>
      {suggestions.length > 0 && (
        <div className="mt-14 text-left">
          <h2 className="mb-6 text-center font-serif text-2xl font-bold text-bark-900">
            Meanwhile, something sweet
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {suggestions.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
