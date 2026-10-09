import type { Metadata } from "next";
import { getSettings } from "@/lib/queries";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Refund Policy" };

export default async function RefundPolicyPage() {
  const settings = await getSettings();
  const brand = (settings.brandName as string) || "MJ Nature Naturals";
  const email = (settings.contactEmail as string) || "";
  return (
    <div className="container-site max-w-3xl py-14 sm:py-20">
      <p className="eyebrow mb-3">Legal</p>
      <h1 className="section-title">Refund Policy</h1>
      <p className="mt-2 text-xs text-bark-500">Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-bark-600">
        <p>
          Your satisfaction matters to us. Because we deal in food products, our refund policy has
          some specific conditions. Please read carefully.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Damaged or Incorrect Orders</h2>
        <p>
          If your order arrives damaged, leaking or incorrect, please contact us within 48 hours of
          delivery with your order number and clear photos. We will review the claim and, where
          appropriate, offer a replacement or a refund to your original payment method.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Non-Returnable Items</h2>
        <p>
          For hygiene and safety reasons, food products cannot be returned once delivered unless
          they are damaged, defective or incorrectly fulfilled. We do not accept returns for
          change-of-mind or taste preferences.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Failed or Cancelled Payments</h2>
        <p>
          If your payment was deducted but your order was not confirmed, the amount is typically
          auto-reversed by your bank within 5–7 business days. If it is not, please contact us with
          your payment reference.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Refund Timeline</h2>
        <p>
          Approved refunds are initiated to the original payment method within 3–5 business days.
          Banks may take an additional 5–7 business days to reflect the amount in your account.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Order Cancellation</h2>
        <p>
          You may cancel an order before it is dispatched. Once shipped, cancellation is not
          possible. To request a cancellation, contact us as soon as possible with your order number.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Contact</h2>
        <p>For refund or cancellation requests, reach us at {email || "our contact page"}.</p>
      </div>
    </div>
  );
}
