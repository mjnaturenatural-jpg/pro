import type { Metadata } from "next";
import { getSettings } from "@/lib/queries";
export const revalidate = 300;

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPolicyPage() {
  const settings = await getSettings();
  const brand = (settings.brandName as string) || "MJ Nature Naturals";
  const email = (settings.contactEmail as string) || "";
  return (
    <div className="container-site max-w-3xl py-14 sm:py-20">
      <p className="eyebrow mb-3">Legal</p>
      <h1 className="section-title">Privacy Policy</h1>
      <p className="mt-2 text-xs text-bark-500">Last updated: {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
      <div className="prose-scope mt-8 space-y-6 text-sm leading-relaxed text-bark-600">
        <p>
          {brand} respects your privacy. This policy explains what information we collect when you
          visit our website, place an order or subscribe to our communications, and how we use it.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Information We Collect</h2>
        <p>
          We collect information you provide directly: your name, email address, phone number, and
          delivery address when you place an order or create an account. We also collect standard
          technical data such as browser type and pages visited to improve the site.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">How We Use Your Information</h2>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>To process and deliver your orders</li>
          <li>To create and manage your account</li>
          <li>To send order updates and, with your consent, marketing communications</li>
          <li>To improve our products, services and website experience</li>
          <li>To detect and prevent fraud or abuse</li>
        </ul>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Payment Information</h2>
        <p>
          Payments are processed by Razorpay, a secure third-party payment gateway. We do not store
          your card number, CVV or banking credentials on our servers. Razorpay processes your
          payment data in accordance with its own privacy policy.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Data Sharing</h2>
        <p>
          We share your data only with service providers necessary to fulfil your order — such as our
          payment processor and shipping partner (Delhivery) — and where required by law. We do not
          sell your personal information.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Cookies</h2>
        <p>
          We use essential cookies to keep you signed in and remember your cart. You can disable
          cookies in your browser, though some features may not work correctly.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Your Rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal data at any time.
          To exercise these rights, contact us at {email || "the email listed on our contact page"}.
        </p>
        <h2 className="pt-2 font-serif text-lg text-bark-900">Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. Changes will be posted on this page with an
          updated revision date.
        </p>
      </div>
    </div>
  );
}
