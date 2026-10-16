"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCw, Truck } from "lucide-react";
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

interface RatesBody {
  options?: unknown;
  error?: string;
  code?: string;
}

/** Drop anything that is not a well-formed courier option before rendering. */
function sanitizeOptions(raw: unknown): CourierOption[] {
  if (!Array.isArray(raw)) return [];
  const out: CourierOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Partial<CourierOption>;
    const id = Number(o.courierId);
    const rate = Number(o.rate);
    const name = typeof o.courierName === "string" ? o.courierName.trim() : "";
    if (!Number.isFinite(id) || !Number.isFinite(rate) || rate < 0 || !name) continue;
    out.push({ courierId: id, courierName: name, rate, etd: typeof o.etd === "string" ? o.etd : "" });
  }
  return out;
}

/** Live Shiprocket courier options for the entered pincode. Hidden when unavailable. */
export function DeliveryOptions({ pincode, lines, standardRate, freeShipping, value, onChange }: DeliveryOptionsProps) {
  const [options, setOptions] = useState<CourierOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const availabilityRef = useRef<boolean | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const pin = pincode.replace(/\D/g, "");
  const ready = isValidPincode(pin) && lines.length > 0;
  const sig = `${pin}|${lines.map((l) => `${l.packSize}x${l.quantity}`).join(",")}`;

  useEffect(() => {
    if (!ready) {
      setOptions(null);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      const fail = (message: string) => {
        if (cancelled) return;
        setOptions(null);
        setError(message);
      };
      try {
        // Availability probe (once per page) — skips the rates request entirely
        // when live rates are not configured, so no console noise and no
        // endless spinner; standard free delivery stays available either way.
        if (availabilityRef.current === null) {
          try {
            const res = await fetch("/api/shipping/rates", {
              cache: "no-store",
              signal: controller.signal,
            });
            if (res.ok) {
              const data = (await res.json().catch(() => null)) as { available?: unknown } | null;
              if (data && typeof data === "object") {
                availabilityRef.current = data.available === true;
              }
            }
          } catch {
            // probe failed — fall through and try the rates request directly
          }
        }
        if (cancelled) return;
        if (availabilityRef.current === false) {
          setOptions([]);
          return;
        }

        const res = await fetch("/api/shipping/rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pincode: pin,
            items: lines.map((l) => ({ packSize: l.packSize, quantity: l.quantity })),
          }),
          signal: controller.signal,
        });
        const data = (await res.json().catch(() => null)) as RatesBody | null;
        if (cancelled) return;
        if (res.ok) {
          setOptions(sanitizeOptions(data?.options));
          return;
        }
        if (res.status === 503 || data?.code === "NOT_CONFIGURED") {
          availabilityRef.current = false;
          setOptions([]);
          return;
        }
        fail(data?.error || "We couldn't load live courier rates right now.");
      } catch {
        if (cancelled || controller.signal.aborted) return;
        fail("We couldn't load live courier rates. Check your connection and retry.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, attempt]);

  useEffect(() => {
    if (value && options && !options.some((o) => o.courierId === value.courierId)) {
      onChangeRef.current(null);
    }
  }, [options, value]);

  if (!ready) return null;
  if (!error && !loading && (!options || options.length === 0)) return null;

  const standardLabel = freeShipping || standardRate === 0 ? "Free" : formatPrice(standardRate);
  const standardRow = (
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
  );

  return (
    <div className="mt-4 rounded-2xl border border-bark-800/10 bg-ivory-100 p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-bark-500">
        <Truck size={14} className="text-leaf-600" /> Delivery Options
      </p>
      {loading && <p className="mt-2.5 text-xs text-bark-500">Checking live courier rates…</p>}
      {!loading && error && (
        <div role="alert">
          <p className="mt-2.5 text-sm text-bark-700">{error}</p>
          <div className="mt-3 space-y-2">
            {standardRow}
            <button
              type="button"
              onClick={() => setAttempt((a) => a + 1)}
              className="btn-secondary btn-sm inline-flex items-center gap-1.5"
            >
              <RotateCw size={13} /> Retry live rates
            </button>
          </div>
        </div>
      )}
      {!loading && !error && options && options.length > 0 && (
        <div className="mt-2.5 space-y-2" role="radiogroup" aria-label="Delivery options">
          {standardRow}
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
