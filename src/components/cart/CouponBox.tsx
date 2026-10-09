"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function CouponBox({
  subtotal,
  applied,
  onApply,
  onRemove,
}: {
  subtotal: number;
  applied: { code: string; discount: number } | null;
  onApply: (c: { code: string; discount: number }) => void;
  onRemove: () => void;
}) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        onApply({ code: data.couponCode || code.toUpperCase(), discount: data.discount });
        toast({ message: "Coupon applied", type: "success" });
        setCode("");
      } else {
        toast({ message: data.error || "Invalid coupon", type: "error" });
      }
    } catch {
      toast({ message: "Could not validate coupon", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5 border-t border-bark-800/10 pt-5">
      <p className="label">Have a coupon?</p>
      {applied ? (
        <div className="flex items-center justify-between rounded-lg bg-leaf-50 px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm text-leaf-700">
            <Tag size={14} />
            <span className="font-medium">{applied.code}</span>
            <span className="text-xs">−{applied.discount > 0 ? "applied" : ""}</span>
          </div>
          <button onClick={onRemove} className="text-bark-500 hover:text-red-500" aria-label="Remove coupon">
            <X size={15} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Coupon code (optional)"
            className="input flex-1 py-2.5"
            aria-label="Coupon code"
          />
          <button onClick={apply} disabled={loading} className="btn-secondary btn-sm shrink-0">
            {loading ? "…" : "Apply"}
          </button>
        </div>
      )}
    </div>
  );
}
