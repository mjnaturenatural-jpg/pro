"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Trash2, ShoppingBag, Lock, Leaf } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { CouponBox } from "@/components/cart/CouponBox";

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCart();
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const mrpTotal = items.reduce((s, i) => s + i.mrp * i.quantity, 0);
  const itemDiscount = mrpTotal - subtotal;
  const couponDiscount = coupon?.discount ?? 0;
  const net = subtotal - couponDiscount;
  const shipping = net >= FREE_SHIPPING_THRESHOLD || net === 0 ? 0 : 79;
  const total = Math.max(0, net + shipping);
  const freeShippingGap = Math.max(0, FREE_SHIPPING_THRESHOLD - net);

  if (items.length === 0) {
    return (
      <div className="container-site py-20 text-center">
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sand-50 text-bark-400">
          <ShoppingBag size={26} />
        </span>
        <h1 className="font-serif text-3xl text-bark-900">Your cart is empty</h1>
        <p className="mt-2 text-sm text-bark-500">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-site py-10 sm:py-14">
      <h1 className="section-title mb-6">Your Cart</h1>
      <div className="mb-8 rounded-2xl border border-bark-800/10 bg-ivory-100 p-4 sm:p-5">
        {freeShippingGap > 0 ? (
          <p className="text-sm font-semibold text-bark-700">
            Add {formatPrice(freeShippingGap)} more for{" "}
            <span className="text-leaf-700">free shipping</span>
          </p>
        ) : (
          <p className="text-sm font-semibold text-leaf-700">
            You have unlocked free shipping
          </p>
        )}
        <div
          className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-bark-800/10"
          role="progressbar"
          aria-valuenow={Math.min(100, Math.round((net / FREE_SHIPPING_THRESHOLD) * 100))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Free shipping progress"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-leaf-600 to-leaf-500 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.round((net / FREE_SHIPPING_THRESHOLD) * 100))}%` }}
          />
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.packSize}`}
              className="card flex gap-4 p-4"
            >
              <Link
                href={`/product/${item.slug}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-sand-50 sm:h-24 sm:w-24"
              >
                {item.image && (
                  <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                )}
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/product/${item.slug}`}
                      className="text-sm font-medium text-bark-900 hover:text-bark-700"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-bark-500">Pack: {item.packSize}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.packSize)}
                    className="p-1 text-bark-400 hover:text-red-500"
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="inline-flex items-center rounded-lg border border-bark-800/15">
                    <button
                      onClick={() => updateQuantity(item.productId, item.packSize, item.quantity - 1)}
                      className="px-3 py-1.5 text-bark-600"
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <span className="min-w-[32px] text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.packSize, item.quantity + 1)}
                      className="px-3 py-1.5 text-bark-600"
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-bark-900">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    {item.mrp > item.price && (
                      <p className="text-xs text-bark-400 line-through">
                        {formatPrice(item.mrp * item.quantity)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="mb-5 font-serif text-lg text-bark-900">Order Summary</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-bark-600">Subtotal</dt>
                <dd className="font-medium">{formatPrice(subtotal)}</dd>
              </div>
              {itemDiscount > 0 && (
                <div className="flex justify-between text-leaf-600">
                  <dt>Item discount</dt>
                  <dd>−{formatPrice(itemDiscount)}</dd>
                </div>
              )}
              {coupon && couponDiscount > 0 && (
                <div className="flex justify-between text-leaf-600">
                  <dt>Coupon ({coupon.code})</dt>
                  <dd>−{formatPrice(couponDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-bark-600">Shipping</dt>
                <dd className="font-medium">
                  {shipping === 0 ? "Free" : formatPrice(shipping)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-bark-800/10 pt-3 text-base">
                <dt className="font-semibold text-bark-900">Total</dt>
                <dd className="font-semibold text-bark-900">{formatPrice(total)}</dd>
              </div>
            </dl>

            {freeShippingGap > 0 && (
              <p className="mt-3 rounded-lg bg-leaf-50 px-3 py-2 text-xs text-leaf-700">
                Add {formatPrice(freeShippingGap)} more to get free shipping.
              </p>
            )}

            <CouponBox
              subtotal={subtotal}
              applied={coupon}
              onApply={(c) => setCoupon(c)}
              onRemove={() => setCoupon(null)}
            />

            <Link href="/checkout" className="btn-primary mt-5 w-full">
              Proceed to Checkout
            </Link>
            <div className="mt-4 flex items-center justify-center gap-4 text-[11px] font-bold uppercase tracking-wider text-bark-500">
              <span className="inline-flex items-center gap-1">
                <Lock size={11} className="text-leaf-600" /> Secure checkout
              </span>
              <span className="inline-flex items-center gap-1">
                <Leaf size={11} className="text-leaf-600" /> 100% Eggless
              </span>
            </div>
            <Link
              href="/shop"
              className="mt-3 block text-center text-sm text-bark-500 hover:text-bark-800"
            >
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
