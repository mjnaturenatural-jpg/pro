"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ProductImage } from "@/components/product/ProductImage";
import { useCart } from "@/store/cart";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/format";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export interface FbtProduct {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  packSizes: { label: string; mrp: number; price: number; stock: number }[];
}

export function FrequentlyBought({ products }: { products: FbtProduct[] }) {
  const addItem = useCart((s) => s.addItem);
  const { toast } = useToast();
  const [checked, setChecked] = useState<string[]>(products.map((p) => p._id));

  if (products.length === 0) return null;

  const toggle = (id: string) =>
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selected = products.filter((p) => checked.includes(p._id));
  const total = selected.reduce((n, p) => {
    const pack = p.packSizes.find((s) => s.stock > 0) ?? p.packSizes[0];
    return n + (pack?.price || 0);
  }, 0);

  const addSelected = () => {
    selected.forEach((p) => {
      const pack = p.packSizes.find((s) => s.stock > 0) ?? p.packSizes[0];
      if (!pack || pack.stock <= 0) return;
      addItem({
        productId: p._id,
        slug: p.slug,
        name: p.name,
        image: p.images[0] || "",
        packSize: pack.label,
        price: pack.price,
        mrp: pack.mrp,
      });
      analytics.addToCart(p._id, p.name, pack.price, 1);
    });
    toast({ message: selected.length > 1 ? `${selected.length} items added` : "Added to cart", type: "success", action: { label: "View Cart", href: "/cart" } });
  };

  return (
    <section className="mt-12">
      <h2 className="font-serif text-xl font-bold text-bark-900 sm:text-2xl">
        Frequently bought together
      </h2>
      <div className="mt-4 space-y-3">
        {products.map((p) => {
          const pack = p.packSizes.find((s) => s.stock > 0) ?? p.packSizes[0];
          const on = checked.includes(p._id);
          return (
            <label
              key={p._id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition",
                on ? "border-caramel-600/50 bg-caramel-50/50" : "border-bark-800/10 bg-ivory-100"
              )}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(p._id)}
                className="h-5 w-5 shrink-0 rounded accent-caramel-600"
                aria-label={`Include ${p.name}`}
              />
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
                {p.images[0] && (
                  <ProductImage src={p.images[0]} slug={p.slug} alt="" sizes="56px" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-bark-900">{p.name}</span>
                <span className="text-xs text-bark-500">
                  {pack.label} · {formatPrice(pack.price)}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-bark-600">
          Total for {selected.length} item{selected.length === 1 ? "" : "s"}:{" "}
          <span className="font-serif text-lg font-bold text-bark-900">{formatPrice(total)}</span>
        </p>
        <button
          type="button"
          onClick={addSelected}
          disabled={selected.length === 0}
          className="btn-primary btn-sm shrink-0 disabled:opacity-50"
        >
          <Plus size={14} /> Add selected
        </button>
      </div>
    </section>
  );
}
