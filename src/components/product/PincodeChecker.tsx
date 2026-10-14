"use client";

import { useState } from "react";
import { MapPin, Truck } from "lucide-react";
import { isValidPincode } from "@/lib/utils";
import { siteConfig } from "@config/site";

function etaFor(pincode: string): string {
  const rule = siteConfig.pincodeEta.find((r) => r.prefixes.some((p) => pincode.startsWith(p)));
  return rule ? rule.label : siteConfig.pincodeEtaDefault;
}

export function PincodeChecker() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const check = (e?: React.FormEvent) => {
    e?.preventDefault();
    const pin = value.replace(/\D/g, "");
    if (!isValidPincode(pin)) {
      setResult({ ok: false, message: "Please enter a valid 6-digit pincode." });
      return;
    }
    setResult({ ok: true, message: `Delivery to ${pin} in ${etaFor(pin)}. Free shipping above ₹${siteConfig.freeShippingThreshold}.` });
  };

  return (
    <div className="mt-6 rounded-2xl border border-bark-800/10 bg-ivory-100 p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-bark-500">
        <Truck size={14} className="text-leaf-600" /> Delivery Estimate
      </p>
      <form onSubmit={check} className="mt-2.5 flex gap-2">
        <label htmlFor="pincode-input" className="sr-only">
          Delivery pincode
        </label>
        <div className="relative flex-1">
          <MapPin size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bark-400" />
          <input
            id="pincode-input"
            inputMode="numeric"
            maxLength={6}
            value={value}
            onChange={(e) => {
              setValue(e.target.value.replace(/\D/g, "").slice(0, 6));
              setResult(null);
            }}
            placeholder="Enter pincode"
            className="input !rounded-full !py-2.5 pl-10"
          />
        </div>
        <button type="submit" className="btn-secondary btn-sm shrink-0">
          Check
        </button>
      </form>
      {result && (
        <p role="status" className={result.ok ? "mt-2.5 text-xs font-semibold text-leaf-700" : "mt-2.5 text-xs font-semibold text-chilli-600"}>
          {result.message}
        </p>
      )}
    </div>
  );
}
