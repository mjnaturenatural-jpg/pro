"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ShoppingBag, Zap, Star, ChevronRight, ChevronLeft, Leaf, ShieldCheck, Milk, Truck, MessageCircle, Maximize2 } from "lucide-react";
import { discountPercent, cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Accordion } from "@/components/ui/Accordion";
import { Modal } from "@/components/ui/Modal";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { analytics } from "@/lib/analytics";
import { getWhatsAppLink, productEnquiryMessage } from "@/lib/whatsapp";
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
  whatsapp = "",
}: {
  product: ProductDetailViewData;
  categoryName?: string;
  whatsapp?: string;
}) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);

  const defaultPack = product.packSizes.find((p) => p.stock > 0) ?? product.packSizes[0];
  const [packLabel, setPackLabel] = useState(defaultPack.label);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
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
  const waHref = getWhatsAppLink(
    productEnquiryMessage(product.name, pack.label),
    whatsapp || undefined
  );

  useEffect(() => {
    analytics.viewItem(product._id, product.name, pack.price);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
    analytics.addToCart(product._id, product.name, pack.price, quantity);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("mj:open-cart"));
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
    analytics.addToCart(product._id, product.name, pack.price, quantity);
    router.push("/checkout");
  };

  return (
    <div className="pb-24 sm:pb-0">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          ...(product.category
            ? [{ label: product.category.name, href: `/shop?category=${product.category.slug}` }]
            : categoryName
              ? [{ label: categoryName }]
              : []),
          { label: product.name },
        ]}
      />

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
              <span className="absolute left-3 top-3 rounded-full bg-chilli-600 px-2.5 py-1 text-[10px] font-bold text-white">
                {pct}% OFF
              </span>
            )}
            {images.length > 0 && (
              <button
                type="button"
                onClick={() => setLightbox(activeImage)}
                aria-label="Zoom product image"
                className="absolute bottom-3 right-3 rounded-full border border-bark-800/10 bg-ivory-100/90 p-2 text-bark-700 shadow transition hover:text-caramel-700"
              >
                <Maximize2 size={16} />
              </button>
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
            <span className="text-3xl font-semibold text-bark-900">{formatPrice(pack.price)}</span>
            {pack.mrp > pack.price && (
              <span className="text-base text-bark-400 line-through">{formatPrice(pack.mrp)}</span>
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
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              max={Math.max(pack.stock, 1)}
            />
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

          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => analytics.whatsappClick("product")}
              className="btn mt-2.5 w-full border border-[#25D366]/50 bg-white py-3 text-sm font-semibold text-[#128C4B] transition hover:bg-[#25D366]/5"
            >
              <MessageCircle size={16} /> Enquire on WhatsApp
            </a>
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
          <div className="mt-10">
            <Accordion
              items={[
                { title: "Product Description", body: product.description },
                { title: "Ingredients", body: product.ingredients },
                { title: "Allergen Information", body: product.allergenInfo },
                { title: "Storage Instructions", body: product.storageInstructions },
                { title: "How to Use", body: product.howToUse },
                { title: "Shipping Information", body: product.shippingInfo },
                { title: "Return / Refund Information", body: product.returnInfo },
              ]
                .filter((s) => s.body && s.body.trim())
                .map((s) => ({
                  title: s.title,
                  body: <p className="whitespace-pre-line">{s.body}</p>,
                }))}
            />
          </div>
          {!(product.reviewCount > 0) && waHref && (
            <p className="mt-6 rounded-2xl bg-sand-100 px-4 py-3 text-center text-xs leading-relaxed text-bark-600">
              Tried this treat?{" "}
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-caramel-700 hover:underline"
              >
                Send us your review on WhatsApp →
              </a>
            </p>
          )}
        </div>
      </div>

      <Modal open={lightbox !== null} onClose={() => setLightbox(null)} title={product.name}>
        {lightbox !== null && images[lightbox] && (
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-sand-50">
            <Image
              src={images[lightbox]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-contain"
            />
          </div>
        )}
      </Modal>

      {/* Sticky mobile add-to-cart bar (sits above the bottom nav) */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-bark-800/10 bg-ivory-50/95 px-4 pb-3 pt-3 backdrop-blur-md sm:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-bark-900">{product.name}</p>
            <p className="text-xs text-bark-500">
              {pack.label} ·{" "}
              <span className="text-sm font-bold text-caramel-700">{formatPrice(pack.price)}</span>
            </p>
          </div>
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="btn-primary btn-sm shrink-0 disabled:opacity-50"
          >
            <ShoppingBag size={14} /> {outOfStock ? "Out of Stock" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
