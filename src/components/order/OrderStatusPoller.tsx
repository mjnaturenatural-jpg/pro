"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

/**
 * Bounded polling of the order's verified payment status. Never starts a new
 * payment — it only re-checks, then refreshes the server-rendered page.
 */
export function OrderStatusPoller({
  orderId,
  token,
}: {
  orderId: string;
  token: string;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [exhausted, setExhausted] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (exhausted) return;
    const MAX_ATTEMPTS = 8;
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status?token=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (!res.ok) throw new Error("status check failed");
        const data = (await res.json()) as { paymentStatus: string };
        if (cancelled || !alive.current) return;
        if (data.paymentStatus === "PAID" || data.paymentStatus === "FAILED") {
          router.refresh();
          return;
        }
      } catch {
        /* transient — keep polling */
      }
      if (cancelled || !alive.current) return;
      setAttempt((a) => {
        if (a + 1 >= MAX_ATTEMPTS) {
          setExhausted(true);
          setChecking(false);
          return a;
        }
        return a + 1;
      });
    };

    setChecking(true);
    tick();
    const t = setInterval(tick, 3500);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [attempt, exhausted, orderId, token, router]);

  if (exhausted) {
    return (
      <div className="mt-6 rounded-2xl border border-caramel-200 bg-caramel-50 p-5 text-center">
        <p className="text-sm font-semibold text-bark-800">
          Still confirming your payment with the bank.
        </p>
        <p className="mt-1 text-xs text-bark-500">
          If you were debited, it will confirm automatically — you can also check again.
        </p>
        <button
          onClick={() => {
            setExhausted(false);
            setAttempt((a) => a + 1);
          }}
          className="btn-secondary btn-sm mx-auto mt-3"
        >
          <RefreshCw size={14} /> Check Again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-2.5 rounded-2xl border border-bark-800/10 bg-ivory-100 px-5 py-4">
      {checking ? (
        <Loader2 size={16} className="animate-spin text-caramel-600" />
      ) : (
        <CheckCircle2 size={16} className="text-leaf-600" />
      )}
      <p className="text-sm font-medium text-bark-700">Verifying your payment…</p>
    </div>
  );
}

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-secondary btn-sm flex-1 print:hidden">
      Print Summary
    </button>
  );
}

export function FailedOrderActions() {
  return (
    <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
      <a href="/cart" className="btn-primary">
        Back to Cart
      </a>
      <a href="/contact" className="btn-secondary">
        <XCircle size={15} /> Contact Us
      </a>
    </div>
  );
}
