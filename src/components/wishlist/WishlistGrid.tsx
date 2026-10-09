"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useWishlist } from "@/store/cart";
import { formatINR, discountPercent } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

export function WishlistGrid() {
  const items = useWishlist((s) => s.items);
  const toggle = useWishlist((s) => s.toggle);
  const { toast } = useToast();

  if (items.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Heart size={36} className="mx-auto mb-4 text-bark-300" />
        <p className="font-serif text-xl text-bark-900">Your wishlist is empty</p>
        <p className="mt-2 text-sm text-bark-500">
          Tap the heart on any product to save it here for later.
        </p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const pct = discountPercent(item.mrp, item.price);
        return (
          <li
            key={item.productId}
            className="card flex items-center gap-4 p-4 sm:gap-5 sm:p-5"
          >
            <Link
              href={`/product/${item.slug}`}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-sand-50 sm:h-24 sm:w-24"
            >
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${item.slug}`}
                className="line-clamp-2 text-sm font-medium text-bark-900 hover:text-leaf-700"
              >
                {item.name}
              </Link>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
                <span className="text-base font-semibold text-bark-900">
                  {formatINR(item.price)}
                </span>
                {item.mrp > item.price && (
                  <span className="text-xs text-bark-400 line-through">
                    {formatINR(item.mrp)}
                  </span>
                )}
                {pct > 0 && (
                  <span className="text-xs font-semibold text-leaf-600">{pct}% off</span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/product/${item.slug}`}
                className="btn-primary btn-sm hidden sm:inline-flex"
              >
                <ShoppingBag size={13} /> View
              </Link>
              <button
                onClick={() => {
                  toggle(item);
                  toast({ message: "Removed from wishlist", type: "info" });
                }}
                aria-label="Remove from wishlist"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-bark-800/15 text-bark-500 transition hover:border-red-300 hover:text-red-500"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
