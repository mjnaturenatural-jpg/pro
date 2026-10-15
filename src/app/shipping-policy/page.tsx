import type { Metadata } from "next";
import { getSettings } from "@/lib/queries";
import { PolicyLayout } from "@/components/legal/PolicyLayout";
export const revalidate = 300;

export const metadata: Metadata = { title: "Shipping Policy" };

export default async function ShippingPolicyPage() {
  const settings = await getSettings();
  const brand = (settings.brandName as string) || "MJ Nature Natural";
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
        <p>
          We offer <span className="font-semibold text-leaf-700">free delivery on all orders</span>{" "}
          across India — no minimum order value required.
        </p>
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
