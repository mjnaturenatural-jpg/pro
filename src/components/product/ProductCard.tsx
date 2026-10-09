"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingBag, Zap } from "lucide-react";
import { formatINR, discountPercent, cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useToast } from "@/components/ui/Toast";
import { BADGES } from "@/lib/constants";

export interface ProductCardData {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  images: string[];
  packSizes: { label: string; mrp: number; price: number; stock: number }[];
  badges?: { pureGhee?: boolean; noMaida?: boolean; noAddedSugar?: boolean };
  averageRating?: number;
  reviewCount?: number;
}

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const addItem = useCart((s) => s.addItem);

  const inStock = product.packSizes.some((p) => p.stock > 0);
  const defaultPack =
    product.packSizes.find((p) => p.stock > 0) ?? product.packSizes[0];
  const [selectedPack, setSelectedPack] = useState(defaultPack.label);
  const activePack = product.packSizes.find((p) => p.label === selectedPack) ?? defaultPack;

  const pct = discountPercent(activePack.mrp, activePack.price);
  const activeBadge = BADGES.find((b) => product.badges?.[b.key as keyof typeof product.badges]);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activePack.stock <= 0) return;
    addItem({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] || "",
      packSize: activePack.label,
      price: activePack.price,
      mrp: activePack.mrp,
    });
    toast({
      message: "Added to cart",
      type: "success",
      action: { label: "View Cart", href: "/cart" },
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (activePack.stock <= 0) return;
    addItem({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] || "",
      packSize: activePack.label,
      price: activePack.price,
      mrp: activePack.mrp,
    });
    router.push("/checkout");
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-bark-800/10 bg-white shadow-soft transition duration-300 hover:shadow-lift"
    >
      <div className="relative aspect-square overflow-hidden bg-sand-50">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {pct > 0 && (
            <span className="rounded-full bg-bark-800 px-2.5 py-1 text-[10px] font-bold tracking-wide text-ivory-50">
              {pct}% OFF
            </span>
          )}
          {activeBadge && (
            <span className="rounded-full bg-leaf-100 px-2.5 py-1 text-[10px] font-semibold text-leaf-700">
              {activeBadge.label}
            </span>
          )}
          {!inStock && (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-bark-900 group-hover:text-bark-700">
            {product.name}
          </h3>
          {product.shortDescription && (
            <p className="mt-1 line-clamp-1 text-xs text-bark-500">{product.shortDescription}</p>
          )}
        </div>

        {product.packSizes.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {product.packSizes.map((p) => (
              <button
                key={p.label}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedPack(p.label);
                }}
                className={cn(
                  "rounded-md border px-2 py-1 text-[11px] font-medium transition",
                  p.label === selectedPack
                    ? "border-bark-800 bg-bark-800 text-ivory-50"
                    : "border-bark-800/15 text-bark-600 hover:border-bark-800/40",
                  p.stock <= 0 && "opacity-50"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-base font-semibold text-bark-900">
            {formatINR(activePack.price)}
          </span>
          {activePack.mrp > activePack.price && (
            <span className="text-xs text-bark-400 line-through">{formatINR(activePack.mrp)}</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            disabled={activePack.stock <= 0}
            className="btn-primary btn-sm flex-1"
          >
            <ShoppingBag size={13} /> Add
          </button>
          <button
            onClick={handleBuyNow}
            disabled={activePack.stock <= 0}
            className="btn-accent btn-sm flex-1"
          >
            <Zap size={13} /> Buy Now
          </button>
        </div>
      </div>
    </Link>
  );
}
