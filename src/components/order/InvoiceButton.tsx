"use client";

import { useState } from "react";
import { FileText, Download } from "lucide-react";

export function InvoiceButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice?on=${encodeURIComponent(orderNumber)}`);
      if (!res.ok) throw new Error("Failed to fetch invoice data");
      const { order } = await res.json();
      const html = buildInvoiceHtml(order, orderNumber);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${orderNumber}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={download} disabled={loading} className="btn-secondary btn-sm w-full sm:w-auto sm:flex-1">
      {loading ? (
        <>
          <FileText size={14} /> Preparing…
        </>
      ) : (
        <>
          <Download size={14} /> Download Invoice
        </>
      )}
    </button>
  );
}

interface InvoiceOrder {
  _id: string;
  orderNumber: string;
  createdAt: string;
  paymentStatus: string;
  status: string;
  items: { name: string; packSize: string; quantity: number; price: number; subtotal: number }[];
  subtotal: number;
  shipping: number;
  tax: number;
  couponDiscount: number;
  couponCode: string | null;
  total: number;
  address: Record<string, string>;
  customer: { name: string; email: string; phone: string };
}

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildInvoiceHtml(order: InvoiceOrder, number: string): string {
  const rows = order.items
    .map(
      (i, idx) => `<tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(i.name)}<br><small>Pack: ${escapeHtml(i.packSize)}</small></td>
        <td>${i.quantity}</td>
        <td style="text-align:right">${inr(i.price)}</td>
        <td style="text-align:right">${inr(i.subtotal)}</td>
      </tr>`
    )
    .join("");

  const addr = [
    order.address.fullName,
    order.address.line1,
    order.address.line2,
    order.address.area,
    `${order.address.city}, ${order.address.state} ${order.address.pincode}`,
    order.address.phone,
    order.address.email,
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join("<br>");

  return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${number}</title>
<style>
  body{font-family:Georgia,serif;color:#242F27;background:#fff;margin:40px}
  .doc{max-width:800px;margin:0 auto;border:1px solid #DCE7D0;padding:40px}
  h1{font-size:22px;margin:0;color:#18211B}
  .brand{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #E09A21;padding-bottom:16px;margin-bottom:24px}
  .muted{color:#57685B;font-size:13px}
  table{width:100%;border-collapse:collapse;margin:20px 0;font-size:14px}
  th{background:#F7FBF4;text-align:left;padding:10px;border-bottom:1px solid #DCE7D0;font-size:12px;text-transform:uppercase;letter-spacing:.08em}
  td{padding:10px;border-bottom:1px solid #EDF5E5;vertical-align:top}
  .totals{margin-left:auto;width:280px;font-size:14px}
  .totals div{display:flex;justify-content:space-between;padding:6px 0}
  .grand{border-top:2px solid #E09A21;font-weight:bold;font-size:16px;margin-top:6px;padding-top:10px}
  .badge{display:inline-block;background:#DCF2D6;color:#2A6B2E;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:bold}
  .foot{margin-top:32px;font-size:12px;color:#57685B;text-align:center;border-top:1px solid #DCE7D0;padding-top:16px}
  @media print{body{margin:0}.doc{border:none}}
</style></head><body><div class="doc">
  <div class="brand">
    <div><h1>MJ Nature Naturals</h1><div class="muted">Tax Invoice</div></div>
    <div style="text-align:right"><div class="muted">Invoice No</div><strong>${number}</strong><br>
    <div class="muted">Date</div>${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
  </div>
  <div style="display:flex;justify-content:space-between;gap:24px;margin-bottom:8px">
    <div><strong>Bill To</strong><div class="muted" style="line-height:1.6">${addr}</div></div>
    <div style="text-align:right"><span class="badge">${order.paymentStatus}</span><br><span class="muted">Status: ${order.status}</span></div>
  </div>
  <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="totals">
    <div><span>Subtotal</span><span>${inr(order.subtotal)}</span></div>
    ${order.couponDiscount > 0 ? `<div><span>Coupon ${escapeHtml(order.couponCode || "")}</span><span>-${inr(order.couponDiscount)}</span></div>` : ""}
    <div><span>Shipping</span><span>${order.shipping === 0 ? "Free" : inr(order.shipping)}</span></div>
    ${order.tax > 0 ? `<div><span>Tax</span><span>${inr(order.tax)}</span></div>` : ""}
    <div class="grand"><span>Total</span><span>${inr(order.total)}</span></div>
  </div>
  <div class="foot">Thank you for your order · MJ Nature Naturals<br>Payment status: ${order.paymentStatus}</div>
</div></body></html>`;
}

function escapeHtml(s: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
