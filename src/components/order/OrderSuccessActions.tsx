"use client";

import { Download, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { PrintButton } from "@/components/order/OrderStatusPoller";

export function OrderSuccessActions({
  orderId,
  orderNumber,
  token,
  showReceipt,
}: {
  orderId: string;
  orderNumber: string;
  token: string;
  showReceipt: boolean;
}) {
  const receiptHref = `/api/orders/${orderId}/receipt?token=${encodeURIComponent(token)}`;
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-bark-800/10 pt-6 sm:flex-row print:hidden">
      {showReceipt && (
        <a
          href={receiptHref}
          download={`MJ-Nature-Order-${orderNumber}.pdf`}
          className="btn-secondary btn-sm flex-1"
        >
          <Download size={14} /> Download Receipt (PDF)
        </a>
      )}
      <PrintButton />
      <Link href="/shop" className="btn-primary flex-1">
        <ShoppingBag size={14} /> Continue Shopping
      </Link>
    </div>
  );
}
