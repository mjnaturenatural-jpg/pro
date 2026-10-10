"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { useToast } from "@/components/ui/Toast";
import { formatINR, isValidIndianPhone, isValidPincode } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD, INDIAN_STATES } from "@/lib/constants";
import { CouponBox } from "@/components/cart/CouponBox";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface AddressForm {
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
}

const EMPTY: AddressForm = {
  fullName: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clearCart);

  const [address, setAddress] = useState<AddressForm>(EMPTY);
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rzpLoaded, setRzpLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // prefill from localStorage profile if available
    try {
      const raw = localStorage.getItem("mj-profile");
      if (raw) {
        const p = JSON.parse(raw) as Partial<AddressForm>;
        setAddress((a) => ({ ...a, ...p }));
      }
    } catch {
      // ignore
    }
    if (document.getElementById("razorpay-script")) {
      setRzpLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setRzpLoaded(true);
    document.body.appendChild(script);
  }, []);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const mrpTotal = items.reduce((s, i) => s + i.mrp * i.quantity, 0);
  const couponDiscount = coupon?.discount ?? 0;
  const net = subtotal - couponDiscount;
  const shipping = net >= FREE_SHIPPING_THRESHOLD || net === 0 ? 0 : 79;
  const total = Math.max(0, net + shipping);

  const set = (key: keyof AddressForm, value: string) => {
    setAddress((a) => ({ ...a, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (address.fullName.trim().length < 2) e.fullName = "Enter your full name";
    if (!isValidIndianPhone(address.phone)) e.phone = "Enter a valid 10-digit Indian mobile number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) e.email = "Enter a valid email";
    if (address.line1.trim().length < 3) e.line1 = "Address is required";
    if (address.area.trim().length < 2) e.area = "Area / landmark is required";
    if (address.city.trim().length < 2) e.city = "City is required";
    if (!address.state) e.state = "Select a state";
    if (!isValidPincode(address.pincode)) e.pincode = "Enter a valid 6-digit pincode";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const payNow = async () => {
    if (items.length === 0) {
      toast({ message: "Your cart is empty", type: "error" });
      return;
    }
    if (!validate()) {
      toast({ message: "Please fix the highlighted fields", type: "error" });
      return;
    }
    setLoading(true);
    try {
      // persist profile for next checkout
      localStorage.setItem("mj-profile", JSON.stringify(address));

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            packSize: i.packSize,
            quantity: i.quantity,
          })),
          address,
          couponCode: coupon?.code || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ message: data.error || "Could not start checkout", type: "error" });
        setLoading(false);
        return;
      }

      if (!rzpLoaded || !window.Razorpay) {
        toast({ message: "Payment gateway is still loading. Please try again.", type: "error" });
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "MJ Nature Naturals",
        description: `Order ${data.orderNumber}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: address.fullName,
          email: address.email,
          contact: address.phone,
        },
        theme: { color: "#398B43" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const verify = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const vd = await verify.json();
          if (vd.ok) {
            clearCart();
            router.push(`/order-success/${vd.orderId}`);
          } else {
            toast({ message: vd.error || "Payment verification failed", type: "error" });
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast({
              message: "Payment cancelled. Your order is saved as pending.",
              type: "info",
            });
          },
        },
      });
      rzp.open();
    } catch (err) {
      console.error("checkout error", err);
      toast({ message: "Something went wrong. Please try again.", type: "error" });
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-site py-20 text-center">
        <h1 className="font-serif text-3xl text-bark-900">Nothing to checkout</h1>
        <p className="mt-2 text-sm text-bark-500">Add some products to your cart first.</p>
        <Link href="/shop" className="btn-primary mt-6 inline-flex">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container-site py-10 sm:py-14">
      <div className="mb-8">
        <p className="eyebrow mb-2">Checkout</p>
        <h1 className="section-title">Delivery Details</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="card p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              payNow();
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" error={errors.fullName}>
                <input
                  className="input"
                  value={address.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  autoComplete="name"
                  placeholder="Your full name"
                />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <input
                  className="input"
                  value={address.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  autoComplete="tel"
                  inputMode="numeric"
                  placeholder="10-digit mobile number"
                />
              </Field>
            </div>

            <Field label="Email" error={errors.email}>
              <input
                className="input"
                type="email"
                value={address.email}
                onChange={(e) => set("email", e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </Field>

            <Field label="Address" error={errors.line1}>
              <input
                className="input"
                value={address.line1}
                onChange={(e) => set("line1", e.target.value)}
                autoComplete="address-line1"
                placeholder="House no., Street, Area"
              />
            </Field>

            <Field label="Apartment / House / Floor (optional)">
              <input
                className="input"
                value={address.line2}
                onChange={(e) => set("line2", e.target.value)}
                autoComplete="address-line2"
                placeholder="Apartment, suite, floor"
              />
            </Field>

            <Field label="Area / Landmark" error={errors.area}>
              <input
                className="input"
                value={address.area}
                onChange={(e) => set("area", e.target.value)}
                placeholder="Locality or nearest landmark"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City" error={errors.city}>
                <input
                  className="input"
                  value={address.city}
                  onChange={(e) => set("city", e.target.value)}
                  autoComplete="address-level2"
                />
              </Field>
              <Field label="State" error={errors.state}>
                <select
                  className="input"
                  value={address.state}
                  onChange={(e) => set("state", e.target.value)}
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Pincode" error={errors.pincode}>
                <input
                  className="input"
                  value={address.pincode}
                  onChange={(e) => set("pincode", e.target.value)}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="6-digit pincode"
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 w-full py-4 text-base"
            >
              {loading ? "Opening payment…" : `Pay ${formatINR(total)} Securely`}
            </button>
            <p className="text-center text-xs text-bark-500">
              Payments are processed securely via Razorpay. Your card details are never stored on our servers.
            </p>
          </form>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="mb-4 font-serif text-lg text-bark-900">Order Summary</h2>
            <ul className="mb-4 space-y-3">
              {items.map((item) => (
                <li key={`${item.productId}-${item.packSize}`} className="flex gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-sand-50">
                    {item.image && (
                      <Image src={item.image} alt="" fill sizes="48px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium text-bark-800">{item.name}</p>
                    <p className="text-[11px] text-bark-500">
                      {item.packSize} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-xs font-medium">{formatINR(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2.5 border-t border-bark-800/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-bark-600">Subtotal</dt>
                <dd>{formatINR(subtotal)}</dd>
              </div>
              {coupon && couponDiscount > 0 && (
                <div className="flex justify-between text-leaf-600">
                  <dt>Coupon ({coupon.code})</dt>
                  <dd>−{formatINR(couponDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-bark-600">Shipping</dt>
                <dd>{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-bark-800/10 pt-2.5 text-base font-semibold text-bark-900">
                <dt>Total</dt>
                <dd>{formatINR(total)}</dd>
              </div>
            </dl>
            <CouponBox
              subtotal={subtotal}
              applied={coupon}
              onApply={(c) => setCoupon(c)}
              onRemove={() => setCoupon(null)}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
