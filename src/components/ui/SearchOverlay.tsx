"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import Image from "next/image";
import { formatINR } from "@/lib/utils";

interface SearchProduct {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.products || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchResults(query), 300);
    return () => clearTimeout(t);
  }, [query, fetchResults]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-forest-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mx-auto mt-20 w-full max-w-lg animate-fadeUp px-4">
        <div className="overflow-hidden rounded-2xl border border-bark-800/10 bg-ivory-100 shadow-lift">
          <div className="flex items-center gap-3 border-b border-bark-800/10 px-5">
            <Search size={18} className="text-bark-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 py-4 text-sm text-bark-800 placeholder:text-bark-400 focus:outline-none"
            />
            <button onClick={onClose} aria-label="Close search" className="p-1 text-bark-500 hover:text-bark-800">
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="p-4 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-14" />
                ))}
              </div>
            )}
            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <div className="p-8 text-center text-sm text-bark-500">
                No products found for “{query}”.
              </div>
            )}
            {!loading &&
              results.map((p) => (
                <button
                  key={p._id}
                  onClick={() => {
                    onClose();
                    router.push(`/product/${p.slug}`);
                  }}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-bark-800/10"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-sand-50">
                    {p.images[0] && (
                      <Image src={p.images[0]} alt={p.name} fill className="object-cover" sizes="48px" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-bark-800">{p.name}</p>
                    <p className="text-xs text-bark-500">{formatINR(p.price)}</p>
                  </div>
                </button>
              ))}
            {!query && (
              <div className="p-6 text-center text-sm text-bark-500">
                Start typing to search our products…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
