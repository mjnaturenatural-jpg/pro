"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { SORT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

const PACK_OPTIONS = ["250g", "500g", "750g", "1kg"];

export function ShopPageClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "featured";
  const q = searchParams.get("q") || "";
  const pack = searchParams.get("pack") || "";
  const inStock = searchParams.get("inStock") === "true";
  const maxPrice = searchParams.get("maxPrice") || "";
  const minDiscount = searchParams.get("minDiscount") || "";

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    if (q) params.set("q", q);
    if (pack) params.set("pack", pack);
    if (inStock) params.set("inStock", "true");
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minDiscount) params.set("minDiscount", minDiscount);
    params.set("page", String(page));
    params.set("limit", "24");

    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setProducts(data.products || []);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, sort, q, pack, inStock, maxPrice, minDiscount, page]);

  useEffect(() => {
    setPage(1);
  }, [category, sort, q, pack, inStock, maxPrice, minDiscount]);

  const filters = (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-bark-700">Category</h3>
        <div className="space-y-1.5">
          <FilterChip label="All Categories" active={!category} onClick={() => setParam("category", "")} />
          {categories.map((c) => (
            <FilterChip
              key={c.slug}
              label={c.name}
              active={category === c.slug}
              onClick={() => setParam("category", c.slug)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-bark-700">Pack Size</h3>
        <div className="flex flex-wrap gap-2">
          {PACK_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => setParam("pack", pack === p ? "" : p)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                pack === p
                  ? "border-caramel-500 bg-caramel-500 text-forest-900"
                  : "border-bark-800/15 text-bark-600 hover:border-bark-800/40"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-bark-700">Max Price</h3>
        <div className="flex flex-wrap gap-2">
          {["300", "500", "1000", "2000"].map((p) => (
            <button
              key={p}
              onClick={() => setParam("maxPrice", maxPrice === p ? "" : p)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                maxPrice === p
                  ? "border-caramel-500 bg-caramel-500 text-forest-900"
                  : "border-bark-800/15 text-bark-600 hover:border-bark-800/40"
              )}
            >
              Under ₹{p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-bark-700">Discount</h3>
        <div className="flex flex-wrap gap-2">
          {["10", "20", "30"].map((d) => (
            <button
              key={d}
              onClick={() => setParam("minDiscount", minDiscount === d ? "" : d)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                minDiscount === d
                  ? "border-caramel-500 bg-caramel-500 text-forest-900"
                  : "border-bark-800/15 text-bark-600 hover:border-bark-800/40"
              )}
            >
              {d}%+ off
            </button>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-bark-700">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => setParam("inStock", e.target.checked ? "true" : "")}
          className="h-4 w-4 rounded border-bark-800/20 text-caramel-500 focus:ring-caramel-500"
        />
        In stock only
      </label>

      <button
        onClick={() => router.push(pathname, { scroll: false })}
        className="text-xs font-medium text-caramel-600 hover:text-caramel-700"
      >
        Clear all filters
      </button>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24">{filters}</div>
      </aside>

      <div>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltersOpen(true)}
              className="btn-secondary btn-sm lg:hidden"
            >
              <SlidersHorizontal size={14} /> Filters
            </button>
            <p className="text-sm text-bark-500">
              {loading ? "Loading…" : `${total} product${total === 1 ? "" : "s"}`}
            </p>
          </div>
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="rounded-lg border border-bark-800/15 bg-ivory-100 px-3 py-2 text-sm text-bark-700 focus:border-caramel-500 focus:outline-none"
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[3/4]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-bark-800/10 bg-ivory-100 px-6 py-20 text-center">
            <p className="font-serif text-xl text-bark-800">No products found</p>
            <p className="mt-2 text-sm text-bark-500">Try adjusting your filters or search.</p>
            <button
              onClick={() => router.push(pathname, { scroll: false })}
              className="btn-secondary btn-sm mt-5"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p._id} product={p} priority={i < 4} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn-secondary btn-sm disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-3 text-sm text-bark-600">
              Page {page} of {pages}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary btn-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-forest-900/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-ivory-50 p-6 animate-fadeUp">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-lg text-bark-900">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <X size={20} />
              </button>
            </div>
            {filters}
            <button onClick={() => setFiltersOpen(false)} className="btn-primary mt-6 w-full">
              Show {total} products
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "block w-full rounded-lg px-3 py-2 text-left text-sm transition",
        active ? "bg-caramel-500 text-forest-900" : "text-bark-600 hover:bg-forest-800/10"
      )}
    >
      {label}
    </button>
  );
}
