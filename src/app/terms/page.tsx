import type { Metadata } from "next";
import { getSettings } from "@/lib/queries";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default async function TermsPage() {
  const settings = await getSettings();
  const brand = (settings.brandName as string) || "MJ Nature Naturals";
  const email = (settings.contactEmail as string) || "";
  return (
    <div className="container-site max-w-3xl py-14 sm:py-20">
      <p className="eyebrow mb-3">Legal</p>
      <h1 className="section-title">Terms & Conditions</h1>
      <p className="mt-2 text-xs text-bark-500">Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-bark-600">
        <p>
          These terms govern your use of the {brand} website and the purchase of our products. By
          placing an order, you agree to these terms.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Orders</h2>
        <p>
          All orders are subject to acceptance and availability. We reserve the right to refuse or
          cancel any order at our sole discretion, including in cases of suspected fraud or pricing
          errors.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Pricing & Payment</h2>
        <p>
          All prices are displayed in Indian Rupees (₹) and include applicable taxes unless stated
          otherwise. Payment is processed securely through Razorpay at the time of checkout.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Shipping</h2>
        <p>
          Orders are dispatched according to our shipping timelines. Delivery timelines are estimates
          and not guarantees. Please refer to our Shipping Policy for details.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Returns & Refunds</h2>
        <p>
          As we deal in food products, returns are governed by our Refund Policy. Please review it
          before placing an order.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Product Information</h2>
        <p>
          We strive to display accurate product information, including ingredients and allergens.
          Packaging may vary occasionally. Always check the label on the actual product before
          consumption, especially if you have allergies.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Intellectual Property</h2>
        <p>
          All content on this website — including logos, images, text and design — is the property
          of {brand} and may not be reproduced without written permission.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, {brand} shall not be liable for any indirect,
          incidental or consequential damages arising from the use of our website or products.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Governing Law</h2>
        <p>
          These terms are governed by the laws of India. Any disputes shall be subject to the
          exclusive jurisdiction of the courts in India.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Contact</h2>
        <p>Questions about these terms? Reach us at {email || "our contact page"}.</p>
      </div>
    </div>
  );
}
