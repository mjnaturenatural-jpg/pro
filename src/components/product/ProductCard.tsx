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
  const discount = discountPercent(activePack.mrp, activePack.price);

  const categoryName =
    typeof product.category === "object" ? product.category?.name || "" : "";
  const tags = [
    product.featured ? "Bestseller" : "",
    product.badges?.pureGhee ? "Pure Ghee" : "",
    /millet/i.test(categoryName) || /millet/i.test(product.name) ? "Millet" : "",
  ].filter(Boolean).slice(0, 2);
  const handleAdd = () => {
    if (activePack.stock <= 0) return;
    addItem({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] || "",
      packSize: activePack.label,
        price: activePack.price,
        mrp: activePack.mrp,
        stock: activePack.stock,
    });
    analytics.addToCart(product._id, product.name, activePack.price, 1);
    toast({
      message: "Added to cart",
      type: "success",
      action: { label: "View Cart", href: "/cart" },
    });
  };

  const handleBuyNow = () => {
    if (activePack.stock <= 0) return;
    addItem({
      productId: product._id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] || "",
      packSize: activePack.label,
        price: activePack.price,
        mrp: activePack.mrp,
        stock: activePack.stock,
    });
    analytics.addToCart(product._id, product.name, activePack.price, 1);
    router.push("/checkout");
  };

  const toggleHeart = () => {
    toggleWishlist(product._id);
  };

  const images = resolveProductImages(product.images, product.slug).slice(0, 2);

  return (
    <article
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-bark-800/10 bg-ivory-100 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-2 hover:ring-honey-300/70 sm:rounded-[32px]"
    >
      <Link href={`/product/${product.slug}`} className="relative aspect-[4/3] overflow-hidden bg-white sm:aspect-square" aria-label={product.name}>
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
      </Link>

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
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link href={`/product/${product.slug}`} className="line-clamp-2 text-sm font-medium leading-snug text-bark-900 hover:text-bark-700">
              {product.name}
            </Link>
          {product.shortDescription && (
            <p className="mt-1 line-clamp-1 text-xs text-bark-500">{product.shortDescription}</p>
          )}
          {(product.reviewCount ?? 0) > 0 && (
            <div className="mt-1.5">
              <Rating value={product.averageRating || 0} count={product.reviewCount} size={12} />
            </div>
          )}
          </div>
          <button
            type="button"
            onClick={toggleHeart}
            aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            aria-pressed={wished}
            className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition", wished ? "border-chilli-600 bg-chilli-600 text-white" : "border-bark-800/10 text-bark-500 hover:text-chilli-600")}
          >
            <Heart size={15} fill={wished ? "currentColor" : "none"} />
          </button>
        </div>

        {product.packSizes.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose pack size">
            {product.packSizes.map((p) => (
              <button
                key={p.label}
                onClick={() => setSelectedPack(p.label)}
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
          <span className="text-base font-bold text-caramel-700">{formatPrice(activePack.price)}</span>
          <span className="text-xs text-bark-500">/ {activePack.label}</span>
          {activePack.mrp > activePack.price && (
            <span
              className="text-xs text-bark-400 line-through"
            >
              MRP {formatPrice(activePack.mrp)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          {discount > 0 ? <span className="font-bold text-chilli-600">Save {discount}%</span> : <span />}
          <span className={activePack.stock > 0 ? "text-leaf-700" : "font-medium text-red-600"}>
            {activePack.stock > 0 ? "In stock" : "Out of stock"}
          </span>
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
    </article>
  );
}
