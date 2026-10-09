"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, ShoppingBag, Zap, Star, ChevronRight } from "lucide-react";
import { formatINR, discountPercent, cn } from "@/lib/utils";
import { useCart, useWishlist } from "@/store/cart";
import { useToast } from "@/components/ui/Toast";
import { BADGES } from "@/lib/constants";

export interface ProductDetailViewData {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  ingredients: string;
  allergenInfo: string;
  storageInstructions: string;
  howToUse: string;
  shippingInfo: string;
  returnInfo: string;
  images: string[];
  packSizes: { label: string; mrp: number; price: number; stock: number; sku: string }[];
  badges: { pureGhee: boolean; noMaida: boolean; noAddedSugar: boolean };
  averageRating: number;
  reviewCount: number;
  category?: { name: string; slug: string };
}

export function ProductDetailView({
  product,
  categoryName,
}: {
  product: ProductDetailViewData;
  categoryName?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const addItem = useCart((s) => s.addItem);
  const toggleWish = useWishlist((s) => s.toggle);
  const wishItems = useWishlist((s) => s.items);
  const wished = wishItems.some((i) => i.productId === product._id);

  const defaultPack = product.packSizes.find((p) => p.stock > 0) ?? product.packSizes[0];
  const [packLabel, setPackLabel] = useState(defaultPack.label);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const pack = product.packSizes.find((p) => p.label === packLabel) ?? defaultPack;
  const pct = discountPercent(pack.mrp, pack.price);
  const outOfStock = pack.stock <= 0;
  const activeBadges = BADGES.filter(
    (b) => product.badges?.[b.key as keyof typeof product.badges]
  );

  const handleAdd = () => {
    if (outOfStock) return;
    addItem(
      {
        productId: product._id,
        slug: product.slug,
        name: product.name,
        image: product.images[0] || "",
        packSize: pack.label,
        price: pack.price,
        mrp: pack.mrp,
      },
      quantity
    );
    toast({
      message: "Added to cart",
      type: "success",
      action: { label: "View Cart", href: "/cart" },
    });
  };

  const handleBuyNow = () => {
    if (outOfStock) return;
    addItem(
      {
        productId: product._id,
        slug: product.slug,
        name: product.name,
        image: product.images[0] || "",
        packSize: pack.label,
        price: pack.price,
        mrp: pack.mrp,
      },
      quantity
    );
    router.push("/checkout");
  };

  return (
    <div>
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-bark-500">
        <Link href="/" className="hover:text-bark-800">Home</Link>
        <ChevronRight size={12} />
        <Link href="/shop" className="hover:text-bark-800">Shop</Link>
        {product.category && (
          <>
            <ChevronRight size={12} />
            <Link href={`/shop?category=${product.category.slug}`} className="hover:text-bark-800">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight size={12} />
        <span className="truncate text-bark-700">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-bark-800/10 bg-sand-50">
            {product.images[activeImage] && (
              <Image
                src={product.images[activeImage]}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            )}
            {pct > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-bark-800 px-3 py-1.5 text-xs font-bold text-ivory-50">
                {pct}% OFF
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition",
                    i === activeImage ? "border-caramel-500" : "border-transparent opacity-70 hover:opacity-100"
                  )}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image src={img} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {activeBadges.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {activeBadges.map((b) => (
                <span
                  key={b.key}
                  className="rounded-full bg-leaf-100 px-3 py-1 text-xs font-semibold text-leaf-700"
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}

          <h1 className="font-serif text-3xl leading-tight text-bark-900 sm:text-4xl">
            {product.name}
          </h1>

          {product.reviewCount > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={15}
                    className={
                      i < Math.round(product.averageRating)
                        ? "fill-caramel-400 text-caramel-400"
                        : "text-sand-300"
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-bark-500">
                {product.averageRating} ({product.reviewCount} review
                {product.reviewCount === 1 ? "" : "s"})
              </span>
            </div>
          )}

          {product.shortDescription && (
            <p className="mt-3 text-sm leading-relaxed text-bark-600">{product.shortDescription}</p>
          )}

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-bark-900">{formatINR(pack.price)}</span>
            {pack.mrp > pack.price && (
              <span className="text-base text-bark-400 line-through">{formatINR(pack.mrp)}</span>
            )}
            {pct > 0 && <span className="text-sm font-semibold text-leaf-600">Save {pct}%</span>}
          </div>

          {/* Pack selector */}
          <div className="mt-6">
            <p className="label">Pack Size</p>
            <div className="flex flex-wrap gap-2">
              {product.packSizes.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setPackLabel(p.label)}
                  className={cn(
                    "rounded-lg border px-4 py-2.5 text-sm font-medium transition",
                    p.label === packLabel
                      ? "border-bark-800 bg-bark-800 text-ivory-50"
                      : "border-bark-800/15 text-bark-700 hover:border-bark-800/40",
                    p.stock <= 0 && "opacity-50"
                  )}
                >
                  {p.label}
                  {p.stock <= 0 && <span className="ml-1.5 text-[10px] font-normal">Out</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-5">
            <p className="label">Quantity</p>
            <div className="inline-flex items-center rounded-lg border border-bark-800/15 bg-white">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-2.5 text-bark-600 hover:text-bark-900"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="min-w-[40px] text-center text-sm font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(Math.max(pack.stock, 1), q + 1))}
                className="px-4 py-2.5 text-bark-600 hover:text-bark-900"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            {pack.stock > 0 && pack.stock <= 10 && (
              <p className="mt-2 text-xs text-caramel-600">Only {pack.stock} left in stock</p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-7 flex gap-3">
            <button onClick={handleAdd} disabled={outOfStock} className="btn-primary flex-1">
              <ShoppingBag size={16} /> {outOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
            <button onClick={handleBuyNow} disabled={outOfStock} className="btn-accent flex-1">
              <Zap size={16} /> Buy Now
            </button>
            <button
              onClick={() => {
                toggleWish({
                  productId: product._id,
                  slug: product.slug,
                  name: product.name,
                  image: product.images[0] || "",
                  price: product.packSizes[0]?.price ?? 0,
                  mrp: product.packSizes[0]?.mrp ?? 0,
                });
                toast({
                  message: wished ? "Removed from wishlist" : "Saved to wishlist",
                  type: "info",
                });
              }}
              aria-label="Toggle wishlist"
              className={cn(
                "flex h-[50px] w-[50px] items-center justify-center rounded-full border transition",
                wished
                  ? "border-red-200 bg-red-50 text-red-500"
                  : "border-bark-800/15 text-bark-600 hover:border-bark-800/40"
              )}
            >
              <Heart size={18} fill={wished ? "currentColor" : "none"} />
            </button>
          </div>

          {outOfStock && (
            <p className="mt-3 text-sm text-red-500">
              This pack size is currently out of stock. Try another size.
            </p>
          )}

          {/* Info accordion */}
          <div className="mt-10 divide-y divide-bark-800/10 border-y border-bark-800/10">
            {[
              { title: "Product Description", body: product.description },
              { title: "Ingredients", body: product.ingredients },
              { title: "Allergen Information", body: product.allergenInfo },
              { title: "Storage Instructions", body: product.storageInstructions },
              { title: "How to Use", body: product.howToUse },
              { title: "Shipping Information", body: product.shippingInfo },
              { title: "Return / Refund Information", body: product.returnInfo },
            ]
              .filter((s) => s.body && s.body.trim())
              .map((s) => (
                <details key={s.title} className="group py-4">
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-bark-800 marker:content-none">
                    {s.title}
                    <span className="text-bark-400 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-bark-600">
                    {s.body}
                  </p>
                </details>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
