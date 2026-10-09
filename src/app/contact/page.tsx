import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { getSettings } from "@/lib/queries";
import { ContactForm } from "@/components/contact/ContactForm";
import { Metadata } from "next";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with MJ Nature Naturals — we're here to help with orders, products and queries.",
};

export default async function ContactPage() {
  const settings = await getSettings();
  const email = (settings.contactEmail as string) || "";
  const phone = (settings.phone as string) || "";
  const whatsapp = (settings.whatsapp as string) || "";
  const address = (settings.address as string) || "";

  return (
    <div className="container-site py-14 sm:py-20">
      <div className="mb-10 max-w-2xl">
        <p className="eyebrow mb-2">Contact</p>
        <h1 className="section-title">We&apos;d love to hear from you</h1>
        <p className="mt-3 text-sm leading-relaxed text-bark-600">
          Have a question about an order, a product or anything else? Reach out and we&apos;ll get back to you as soon as we can.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <ContactForm />

        <aside className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-4 font-serif text-lg text-bark-900">Reach Us</h2>
            <ul className="space-y-4">
              {email && (
                <li className="flex items-start gap-3 text-sm text-bark-600">
                  <Mail size={16} className="mt-0.5 shrink-0 text-caramel-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-bark-400">Email</p>
                    <a href={`mailto:${email}`} className="hover:text-bark-900 break-all">
                      {email}
                    </a>
                  </div>
                </li>
              )}
              {phone && (
                <li className="flex items-start gap-3 text-sm text-bark-600">
                  <Phone size={16} className="mt-0.5 shrink-0 text-caramel-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-bark-400">Phone</p>
                    <a href={`tel:${phone}`} className="hover:text-bark-900">
                      {phone}
                    </a>
                  </div>
                </li>
              )}
              {whatsapp && (
                <li className="flex items-start gap-3 text-sm text-bark-600">
                  <MessageCircle size={16} className="mt-0.5 shrink-0 text-caramel-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-bark-400">WhatsApp</p>
                    <a
                      href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-bark-900"
                    >
                      {whatsapp}
                    </a>
                  </div>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-3 text-sm text-bark-600">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-caramel-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-bark-400">Address</p>
                    <p className="whitespace-pre-line">{address}</p>
                  </div>
                </li>
              )}
              {!email && !phone && !whatsapp && !address && (
                <li className="text-sm text-bark-500">
                  Contact details will appear here once configured.
                </li>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
