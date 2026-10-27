"use client";

import { useEffect, useState } from "react";
import { ProductImage } from "@/components/product/ProductImage";
import Link from "next/link";
import { ArrowRight, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { useToast } from "@/components/ui/Toast";
import { Drawer } from "@/components/ui/Drawer";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatPrice } from "@/lib/format";
import { analytics } from "@/lib/analytics";
import { siteConfig } from "@config/site";
import type { ProductCardData } from "@/components/product/ProductCard";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const items = useCart((s) => s.items);
  const addItem = useCart((s) => s.addItem);
  const removeItem = useCart((s) => s.removeItem);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const { toast } = useToast();
  const [upsells, setUpsells] = useState<ProductCardData[]>([]);

  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  const threshold = siteConfig.freeShippingThreshold;
  const gap = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, Math.round((subtotal / threshold) * 100));

  useEffect(() => {
    if (!open) return;
    fetch("/api/products?limit=12")
      .then((r) => r.json())
      .then((d: { products?: ProductCardData[] }) => {
        const inCart = new Set(items.map((i) => i.productId));
        const picks = (d.products || [])
          .filter(
            (p) =>
              !inCart.has(p._id) &&
              p.packSizes.some((s) => s.stock > 0) &&
              Math.min(...p.packSizes.map((s) => s.price)) <= 450
          )
          .slice(0, 3);
        setUpsells(picks);
      })
      .catch(() => setUpsells([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  const quickAdd = (p: ProductCardData) => {
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
    toast({ message: `${p.name} added`, type: "success" });
  };

  return (
    <Drawer open={open} onClose={onClose} title={`Your Cart (${items.reduce((n, i) => n + i.quantity, 0)})`}>
      {items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sand-100 text-bark-400">
            <ShoppingBag size={26} />
          </span>
          <p className="font-serif text-xl text-bark-900">Your cart is empty</p>
          <p className="text-sm text-bark-500">Add something homemade and delicious.</p>
          <Link href="/shop" onClick={onClose} className="btn-primary mt-2">
            Shop Bestsellers <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="border-b border-bark-800/10 px-5 py-4">
            {gap > 0 ? (
              <p className="text-xs font-semibold text-bark-700">
                Add {formatPrice(gap)} more for <span className="text-leaf-700">free shipping</span>
              </p>
            ) : (
              <p className="text-xs font-semibold text-leaf-700">
                You have unlocked free shipping
              </p>
            )}
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-bark-800/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Free shipping progress">
              <div
                className="h-full rounded-full bg-gradient-to-r from-leaf-600 to-leaf-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <ul className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {items.map((item) => (
              <li key={`${item.productId}-${item.packSize}`} className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                  {item.image && (
                    <ProductImage src={item.image} slug={item.slug} alt="" sizes="64px" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-bark-900">{item.name}</p>
                  <p className="text-[11px] text-bark-500">{item.packSize}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <QuantityStepper
                      small
                      value={item.quantity}
                      onChange={(q) => updateQuantity(item.productId, item.packSize, q)}
                      onRemoveAtMin={() => removeItem(item.productId, item.packSize)}
                    />
                    <p className="text-sm font-bold text-bark-900">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId, item.packSize)}
                  aria-label={`Remove ${item.name}`}
                  className="self-start rounded-full p-1.5 text-bark-400 transition hover:bg-chilli-600/10 hover:text-chilli-600"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>

          {upsells.length > 0 && (
            <div className="border-t border-bark-800/10 px-5 py-4">
              <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.14em] text-bark-500">
                Pairs well with
              </p>
              <div className="space-y-2.5">
                {upsells.map((p) => {
                  const pack = p.packSizes.find((s) => s.stock > 0) ?? p.packSizes[0];
                  return (
                    <div key={p._id} className="flex items-center gap-2.5">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white">
                        {p.images[0] && (
                          <ProductImage src={p.images[0]} slug={p.slug} alt="" sizes="44px" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-bark-800">{p.name}</p>
                        <p className="text-[11px] text-bark-500">{formatPrice(pack.price)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => quickAdd(p)}
                        aria-label={`Add ${p.name} to cart`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-caramel-700 text-white transition hover:bg-caramel-600"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-bark-800/10 bg-ivory-100 px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-bark-600">Subtotal</span>
              <span className="font-serif text-lg font-bold text-bark-900">{formatPrice(subtotal)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={() => {
                analytics.beginCheckout(subtotal, items.reduce((n, i) => n + i.quantity, 0));
                onClose();
              }}
              className="btn-primary w-full"
            >
              Checkout <ArrowRight size={16} />
            </Link>
            <Link
              href="/cart"
              onClick={onClose}
              className="mt-2 block text-center text-xs font-semibold text-bark-500 hover:text-caramel-700"
            >
              View full cart
            </Link>
          </div>
        </div>
      )}
    </Drawer>
  );
}
