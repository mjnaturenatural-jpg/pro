"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, ShoppingBag, Zap } from "lucide-react";
import { discountPercent, cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useToast } from "@/components/ui/Toast";
import { Rating } from "@/components/ui/Rating";
import { analytics } from "@/lib/analytics";
import { BADGES, BADGE_STYLES } from "@/lib/constants";
import { PRODUCT_CARD_SIZES, resolveProductImages } from "@/lib/product-images";
import { ProductImage } from "@/components/product/ProductImage";

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
  category?: { name: string; slug: string } | string;
  featured?: boolean;
}

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const addItem = useCart((s) => s.addItem);
  const toggleWishlist = useWishlist((s) => s.toggle);
  const wished = useWishlist((s) => s.has(product._id));

  const inStock = product.packSizes.some((p) => p.stock > 0);
  const defaultPack =
    product.packSizes.find((p) => p.stock > 0) ?? product.packSizes[0];
  const [selectedPack, setSelectedPack] = useState(defaultPack.label);
  const activePack = product.packSizes.find((p) => p.label === selectedPack) ?? defaultPack;
  const fromPack = product.packSizes.reduce((a, b) => (b.price < a.price ? b : a), product.packSizes[0]);
  const fromPct = discountPercent(fromPack.mrp, fromPack.price);

  const categoryName =
    typeof product.category === "object" ? product.category?.name || "" : "";
  const tags = [
    product.featured ? "Bestseller" : "",
    product.badges?.eggless ? "Eggless" : "",
    product.badges?.pureGhee ? "Pure Ghee" : "",
    /millet/i.test(categoryName) || /millet/i.test(product.name) ? "Millet" : "",
  ].filter(Boolean).slice(0, 2);
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
    analytics.addToCart(product._id, product.name, activePack.price, 1);
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
    analytics.addToCart(product._id, product.name, activePack.price, 1);
    router.push("/checkout");
  };

  const toggleHeart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id);
  };

  const images = resolveProductImages(product.images, product.slug).slice(0, 2);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-bark-800/10 bg-ivory-100 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-2 hover:ring-honey-300/70 sm:rounded-[32px]"
    >
      <div className="relative aspect-square overflow-hidden bg-white p-1">
        {images[0] && (
          <ProductImage
            src={images[0]}
            slug={product.slug}
            alt={product.name}
            priority={priority}
            sizes={PRODUCT_CARD_SIZES}
            className={images[1] ? "transition-opacity duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-0" : undefined}
          />
        )}
        {images[1] && (
          <ProductImage
            src={images[1]}
            slug={product.slug}
            alt=""
            sizes={PRODUCT_CARD_SIZES}
            className="pointer-events-none opacity-0 transition-opacity duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
          />
        )}
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
          {fromPct > 0 && (
            <span className="rounded-full bg-chilli-600 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white">
              {fromPct}% OFF
            </span>
          )}
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
        <button
          type="button"
          onClick={toggleHeart}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={wished}
          className={cn(
            "absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full shadow-sm ring-1 ring-bark-800/10 transition",
            wished ? "bg-chilli-600 text-white" : "bg-ivory-100/95 text-bark-500 hover:text-chilli-600"
          )}
        >
          <Heart size={15} fill={wished ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-2.5 sm:p-5">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-caramel-700">
                {t}
              </span>
            ))}
          </div>
        )}
        <div>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-bark-900 group-hover:text-bark-700">
            {product.name}
          </h3>
          {product.shortDescription && (
            <p className="mt-1 line-clamp-1 text-xs text-bark-500">{product.shortDescription}</p>
          )}
          {(product.reviewCount ?? 0) > 0 && (
            <div className="mt-1.5">
              <Rating value={product.averageRating || 0} count={product.reviewCount} size={12} />
            </div>
          )}
        </div>

        {product.packSizes.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose pack size">
            {product.packSizes.map((p) => (
              <button
                key={p.label}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedPack(p.label);
                }}
                aria-pressed={p.label === selectedPack}
                className={cn(
                  "min-h-[32px] rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
                  p.label === selectedPack
                    ? "border-caramel-600 bg-caramel-600 text-white"
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
          <span className="text-base font-bold text-caramel-700">
            from {formatPrice(fromPack.price)}
          </span>
          <span className="text-xs text-bark-500">/ {fromPack.label}</span>
          {fromPack.mrp > 0 && (
            <span
              className={cn(
                "text-xs text-bark-400",
                fromPack.mrp > fromPack.price && "line-through"
              )}
            >
              MRP {formatPrice(fromPack.mrp)}
            </span>
          )}
        </div>

        <div className="flex w-full flex-col gap-2">
          <button
            onClick={handleAdd}
            disabled={activePack.stock <= 0}
            className="btn-primary btn-sm w-full !px-2.5 !py-2 !text-[11px] sm:!px-4 sm:!text-xs"
          >
            <ShoppingBag size={13} /> Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            disabled={activePack.stock <= 0}
            className="btn-secondary btn-sm w-full !px-2.5 !py-2 !text-[11px] sm:!px-4 sm:!text-xs"
          >
            <Zap size={13} /> Buy Now
          </button>
        </div>
      </div>
    </Link>
  );
}
