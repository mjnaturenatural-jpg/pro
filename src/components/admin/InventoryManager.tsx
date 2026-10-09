"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { cn, formatINR } from "@/lib/utils";

interface Pack {
  label: string;
  price: number;
  mrp: number;
  stock: number;
  sku: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  packSizes: Pack[];
  category: { name: string; slug: string };
  published: boolean;
}

export function InventoryManager({
  products,
  categories,
}: {
  products: Product[];
  categories: { _id: string; name: string; slug: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [savingId, setSavingId] = useState("");

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
        if (cat && p.category?.slug !== cat) return false;
        if (lowOnly && !p.packSizes.some((ps) => ps.stock <= 5)) return false;
        return true;
      }),
    [products, q, cat, lowOnly]
  );

  const updateStock = async (productId: string, packLabel: string, stock: number) => {
    setSavingId(`${productId}-${packLabel}`);
    try {
      const res = await fetch(`/api/admin/inventory/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packSize: packLabel, stock }),
      });
      if (res.ok) {
        toast({ message: "Stock updated", type: "success" });
        router.refresh();
      } else {
        const data = await res.json();
        toast({ message: data.error || "Failed", type: "error" });
      }
    } finally {
      setSavingId("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-bark-900">Inventory</h1>
        <p className="text-sm text-bark-500">Stock is managed per pack size.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-bark-800/10 bg-ivory-100 px-3 py-2">
          <Search size={15} className="text-bark-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products…"
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="input max-w-[200px]">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-bark-700">
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} className="h-4 w-4 rounded" />
          Low stock only
        </label>
      </div>

      <div className="space-y-3">
        {filtered.map((p) => (
          <div key={p._id} className="card p-5">
            <div className="flex items-start gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-sand-50">
                {p.images[0] && (
                  <Image src={p.images[0]} alt="" fill sizes="56px" className="object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-bark-900">{p.name}</h2>
                  {!p.published && (
                    <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-semibold text-bark-500">
                      Draft
                    </span>
                  )}
                </div>
                <p className="text-xs text-bark-400">{p.category?.name}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {p.packSizes.map((ps) => {
                    const low = ps.stock <= 5;
                    const out = ps.stock === 0;
                    const key = `${p._id}-${ps.label}`;
                    return (
                      <div
                        key={ps.label}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-lg border px-3 py-2",
                          out ? "border-red-200 bg-red-50" : low ? "border-amber-200 bg-amber-50" : "border-bark-800/10 bg-ivory-50"
                        )}
                      >
                        <div>
                          <p className="text-xs font-semibold text-bark-800">{ps.label}</p>
                          <p className="text-[10px] text-bark-400">{formatINR(ps.price)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            defaultValue={ps.stock}
                            onBlur={(e) => {
                              const v = Number(e.target.value);
                              if (v !== ps.stock) updateStock(p._id, ps.label, v);
                            }}
                            className="w-14 rounded border border-bark-800/15 px-1.5 py-1 text-right text-xs focus:border-caramel-500 focus:outline-none"
                            aria-label={`Stock for ${ps.label}`}
                          />
                          {savingId === key && (
                            <span className="text-[9px] text-caramel-400">…</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-12 text-center text-bark-500">No products match your filters.</div>
        )}
      </div>
    </div>
  );
}
