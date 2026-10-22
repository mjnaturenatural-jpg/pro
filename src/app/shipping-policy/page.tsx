import type { Metadata } from "next";
import { getSettings } from "@/lib/queries";
import { PolicyLayout } from "@/components/legal/PolicyLayout";
export const revalidate = 300;

export const metadata: Metadata = { title: "Shipping Policy" };

export default async function ShippingPolicyPage() {
  const settings = await getSettings();
  const brand = (settings.brandName as string) || "MJ Nature Natural";
  const freeThreshold = (settings.freeShippingThreshold as number) || 999;
  const flat = (settings.flatShipping as number) || 79;
  const email = (settings.contactEmail as string) || "";
  return (
    <PolicyLayout title="Shipping Policy">
      <p>
          We take care to pack every order securely so your products reach you in the best possible
          condition.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Processing Time</h2>
        <p>
          Orders are typically processed within 1–2 business days after payment confirmation.
          Orders placed on weekends or public holidays are processed the next business day.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Delivery</h2>
        <p>
          We ship across India via Shiprocket&apos;s courier partners. Standard delivery usually takes
          3–7 business days depending on your location. Remote areas may take slightly longer.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Shipping Charges</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Free shipping on orders above ₹{freeThreshold}</li>
          <li>Flat shipping fee of ₹{flat} on orders below ₹{freeThreshold}</li>
        </ul>
        <p>Exact shipping charges are shown at checkout before you pay.</p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Tracking</h2>
        <p>
          Once your order ships, an AWB (tracking) number is generated and made available on your
          order page. You can use it to track your shipment in real time.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Address & Delivery Issues</h2>
        <p>
          Please ensure your address and pincode are accurate. We cannot be held responsible for
          delays or failed deliveries caused by incorrect or incomplete addresses. If your package
          arrives damaged, please contact us within 48 hours with photos.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Contact</h2>
        <p>For shipping queries, reach us at {email || "our contact page"}.</p>
    </PolicyLayout>
  );
}
