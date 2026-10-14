"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingBag, Zap } from "lucide-react";
import { formatINR, cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useToast } from "@/components/ui/Toast";
import { BADGES, BADGE_STYLES } from "@/lib/constants";

export interface ProductCardData {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  images: string[];
  packSizes: { label: string; mrp: number; price: number; stock: number }[];
  badges?: { pureGhee?: boolean; eggless?: boolean; noMaida?: boolean; noAddedSugar?: boolean };
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
      className="group relative flex flex-col overflow-hidden rounded-[32px] border border-bark-800/10 bg-ivory-100 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-2 hover:ring-honey-300/70"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-sand-50 to-leaf-50">
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2 transition duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
          {activeBadge && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-semibold",
                BADGE_STYLES[activeBadge.key] ?? "bg-leaf-100 text-leaf-700"
              )}
            >
              {activeBadge.label}
            </span>
          )}
          {!inStock && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-semibold text-red-600">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
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
                    ? "border-caramel-500 bg-caramel-500 text-forest-900"
                    : "border-bark-800/15 text-bark-600 hover:border-bark-800/40",
                  p.stock <= 0 && "opacity-50"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-1">
          <span className="text-base font-semibold text-caramel-600">
            {formatINR(activePack.price)}
          </span>
          {activePack.mrp > 0 && (
            <span
              className={cn(
                "text-xs text-bark-400",
                activePack.mrp > activePack.price && "line-through"
              )}
            >
              MRP {formatINR(activePack.mrp)}
            </span>
          )}
        </div>

        <div className="flex w-full flex-col gap-2">
          <button
            onClick={handleAdd}
            disabled={activePack.stock <= 0}
            className="btn-primary btn-sm w-full"
          >
            <ShoppingBag size={13} /> Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            disabled={activePack.stock <= 0}
            className="btn-secondary btn-sm w-full"
          >
            <Zap size={13} /> Buy Now
          </button>
        </div>
      </div>
    </Link>
  );
}
