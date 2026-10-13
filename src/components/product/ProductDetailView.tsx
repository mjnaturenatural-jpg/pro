"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ShoppingBag, Zap, Star, ChevronRight, ChevronLeft, Leaf, ShieldCheck, Milk, Truck } from "lucide-react";
import { formatINR, discountPercent, cn } from "@/lib/utils";
import { useCart } from "@/store/cart";
import { useToast } from "@/components/ui/Toast";
import { BADGES, BADGE_STYLES } from "@/lib/constants";

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
  badges: { pureGhee: boolean; eggless: boolean; noMaida: boolean; noAddedSugar: boolean };
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

  const defaultPack = product.packSizes.find((p) => p.stock > 0) ?? product.packSizes[0];
  const [packLabel, setPackLabel] = useState(defaultPack.label);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  // Each product shows exactly two designated gallery images (its own photos only).
  const images = (product.images || []).filter(Boolean).slice(0, 2);
  const galleryRef = useRef<HTMLDivElement>(null);

  const goToImage = (i: number) => {
    setActiveImage(i);
    const el = galleryRef.current;
    if (el) {
      el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    }
  };

  const onGalleryScroll = () => {
    const el = galleryRef.current;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeImage) setActiveImage(Math.min(Math.max(idx, 0), images.length - 1));
  };

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
        {/* Gallery — product's own photos only (max two) with swipe + synced controls */}
        <div>
          <div className="relative">
            <div
              ref={galleryRef}
              onScroll={onGalleryScroll}
              className="flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl border border-bark-800/10 bg-sand-50 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {images.length > 0 ? (
                images.map((img, i) => (
                  <div key={i} className="relative h-full w-full shrink-0 snap-start">
                    <Image
                      src={img}
                      alt={i === 0 ? product.name : `${product.name} — view ${i + 1}`}
                      fill
                      priority={i === 0}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-contain p-3"
                    />
                  </div>
                ))
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-bark-400">
                  No image available
                </div>
              )}
            </div>

            {pct > 0 && (
              <span className="absolute left-3 top-3 rounded-full bg-forest-800 px-2.5 py-1 text-[10px] font-bold text-white">
                {pct}% OFF
              </span>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goToImage(Math.max(0, activeImage - 1))}
                  disabled={activeImage === 0}
                  aria-label="Previous image"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-bark-800/10 bg-ivory-100/90 p-1.5 text-bark-700 shadow disabled:opacity-0"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => goToImage(Math.min(images.length - 1, activeImage + 1))}
                  disabled={activeImage === images.length - 1}
                  aria-label="Next image"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-bark-800/10 bg-ivory-100/90 p-1.5 text-bark-700 shadow disabled:opacity-0"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <>
              <div className="mt-3 flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => goToImage(i)}
                    className={cn(
                      "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition",
                      i === activeImage
                        ? "border-caramel-500"
                        : "border-transparent opacity-70 hover:opacity-100"
                    )}
                    aria-label={`View image ${i + 1}`}
                  >
                    <Image src={img} alt="" fill sizes="64px" className="object-contain p-1" />
                  </button>
                ))}
              </div>
              <div className="mt-3 flex justify-center gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToImage(i)}
                    aria-label={`Go to image ${i + 1}`}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      i === activeImage ? "w-6 bg-caramel-500" : "w-2 bg-bark-800/20"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <div>
          {activeBadges.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {activeBadges.map((b) => (
                <span
                  key={b.key}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    BADGE_STYLES[b.key] ?? "bg-leaf-100 text-leaf-700"
                  )}
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
                        ? "fill-caramel-600 text-caramel-600"
                        : "text-bark-300"
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
                      ? "border-caramel-500 bg-caramel-500 text-forest-900"
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
            <div className="inline-flex items-center rounded-lg border border-bark-800/15 bg-ivory-100">
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
            <button onClick={handleBuyNow} disabled={outOfStock} className="btn-secondary flex-1">
              <Zap size={16} /> Buy Now
            </button>
          </div>

          {outOfStock && (
            <p className="mt-3 text-sm text-red-500">
              This pack size is currently out of stock. Try another size.
            </p>
          )}

          {/* Trust strip */}
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-bark-800/10 bg-ivory-100 p-4 sm:grid-cols-4">
            {[
              { Icon: Leaf, label: "100% Eggless" },
              { Icon: ShieldCheck, label: "No Maida" },
              { Icon: Milk, label: "Pure Ghee" },
              { Icon: Truck, label: "Ships Pan-India" },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
                  <Icon size={15} />
                </span>
                <span className="text-xs font-semibold text-bark-700">{label}</span>
              </div>
            ))}
          </div>

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
