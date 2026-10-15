"use client";

import { useEffect, useRef, useState } from "react";
import { Truck } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { isValidPincode } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface CourierSelection {
  courierId: number;
  rate: number;
  name: string;
}

interface CourierOption {
  courierId: number;
  courierName: string;
  rate: number;
  etd: string;
}

interface DeliveryOptionsProps {
  pincode: string;
  lines: { packSize: string; quantity: number }[];
  standardRate: number;
  freeShipping: boolean;
  value: CourierSelection | null;
  onChange: (next: CourierSelection | null) => void;
}

/** Live Shiprocket courier options for the entered pincode. Hidden when unavailable. */
export function DeliveryOptions({ pincode, lines, standardRate, freeShipping, value, onChange }: DeliveryOptionsProps) {
  const [options, setOptions] = useState<CourierOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const pin = pincode.replace(/\D/g, "");
  const ready = isValidPincode(pin) && lines.length > 0;
  const sig = `${pin}|${lines.map((l) => `${l.packSize}x${l.quantity}`).join(",")}`;

  useEffect(() => {
    if (!ready) {
      setOptions(null);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/shipping/rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pincode: pin,
            items: lines.map((l) => ({ packSize: l.packSize, quantity: l.quantity })),
          }),
        });
        const data = await res.json();
        setOptions(res.ok ? data.options || [] : []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  useEffect(() => {
    if (value && options && !options.some((o) => o.courierId === value.courierId)) {
      onChangeRef.current(null);
    }
  }, [options, value]);

  if (!ready) return null;
  if (!loading && options && options.length === 0) return null;

  const standardLabel = freeShipping ? "Free" : formatPrice(standardRate);

  return (
    <div className="mt-4 rounded-2xl border border-bark-800/10 bg-ivory-100 p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-bark-500">
        <Truck size={14} className="text-leaf-600" /> Delivery Options
      </p>
      {loading && <p className="mt-2.5 text-xs text-bark-500">Checking live courier rates…</p>}
      {!loading && options && (
        <div className="mt-2.5 space-y-2" role="radiogroup" aria-label="Delivery options">
          <label
            className={cn(
              "flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-sm transition",
              value === null
                ? "border-caramel-600 bg-caramel-50 font-semibold"
                : "border-bark-800/15 hover:border-bark-800/35"
            )}
          >
            <span className="flex items-center gap-2.5">
              <input
                type="radio"
                name="delivery-option"
                checked={value === null}
                onChange={() => onChange(null)}
                className="h-4 w-4 accent-caramel-600"
              />
              Standard delivery
            </span>
            <span className="font-bold text-bark-900">{standardLabel}</span>
          </label>
          {options.map((o) => {
            const active = value?.courierId === o.courierId;
            return (
              <label
                key={o.courierId}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-sm transition",
                  active
                    ? "border-caramel-600 bg-caramel-50 font-semibold"
                    : "border-bark-800/15 hover:border-bark-800/35"
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <input
                    type="radio"
                    name="delivery-option"
                    checked={active}
                    onChange={() => onChange({ courierId: o.courierId, rate: o.rate, name: o.courierName })}
                    className="h-4 w-4 shrink-0 accent-caramel-600"
                  />
                  <span className="min-w-0">
                    <span className="block truncate">{o.courierName}</span>
                    {o.etd && <span className="block text-[11px] font-normal text-bark-500">Arrives {o.etd}</span>}
                  </span>
                </span>
                <span className="shrink-0 font-bold text-bark-900">{formatPrice(o.rate)}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
