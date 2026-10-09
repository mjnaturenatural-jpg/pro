"use client";

import Link from "next/link";
import { InvoiceButton } from "@/components/order/InvoiceButton";

export function OrderSuccessActions({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: string;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-bark-800/10 pt-6 sm:flex-row">
      <InvoiceButton orderId={orderId} orderNumber={orderNumber} />
      <Link href="/shop" className="btn-primary flex-1">
        Continue Shopping
      </Link>
    </div>
  );
}
