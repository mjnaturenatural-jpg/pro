import { Mail, Phone, MapPin, MessageCircle, Clock, HelpCircle, PackageSearch, Truck, CreditCard, Leaf } from "lucide-react";
import { getSettings } from "@/lib/queries";
import { ContactForm } from "@/components/contact/ContactForm";
import { Metadata } from "next";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with MJ Nature Naturals — we're here to help with orders, products and queries.",
};

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "Orders are prepared and dispatched within a few business days. Exact delivery timelines for your pin code are shown at checkout, and you receive a tracking link once your order ships.",
    Icon: Truck,
  },
  {
    q: "How should I store the products?",
    a: "Keep them in an airtight container in a cool, dry place, away from direct sunlight. Each product page carries specific storage instructions.",
    Icon: Leaf,
  },
  {
    q: "Do your products contain allergens?",
    a: "Many of our products contain nuts, sesame and dairy. Every product page lists detailed allergen information — please check it before ordering if you have an allergy.",
    Icon: HelpCircle,
  },
  {
    q: "How do I track my order?",
    a: "You will receive order updates by email, and a tracking link is shared once the order is dispatched. For any issues, reach out to us with your order number.",
    Icon: PackageSearch,
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept secure online payments at checkout. Your payment details are encrypted and never stored on our servers.",
    Icon: CreditCard,
  },
];

export default async function ContactPage() {
  const settings = await getSettings();
  const email = (settings.contactEmail as string) || "";
  const phone = (settings.phone as string) || "";
  const whatsapp = (settings.whatsapp as string) || "";
  const address = (settings.address as string) || "";

  const methods = [
    email && { label: "Email", value: email, href: `mailto:${email}`, Icon: Mail },
    phone && { label: "Phone", value: phone, href: `tel:${phone}`, Icon: Phone },
    whatsapp && {
      label: "WhatsApp",
      value: whatsapp,
      href: `https://wa.me/${whatsapp.replace(/\D/g, "")}`,
      Icon: MessageCircle,
    },
    address && { label: "Address", value: address, href: "", Icon: MapPin },
  ].filter(Boolean) as { label: string; value: string; href: string; Icon: typeof Mail }[];

  return (
    <>
      {/* Hero band */}
      <section className="border-b border-bark-800/10 bg-gradient-to-r from-forest-800 via-ivory-50 to-caramel-500/15">
        <div className="container-site py-14 text-center sm:py-18">
          <p className="eyebrow mb-3">Contact</p>
          <h1 className="mx-auto max-w-2xl font-serif text-3xl leading-tight text-bark-900 sm:text-4xl">
            We&apos;d love to hear from you
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-bark-600 sm:text-base">
            Questions about an order, a product or anything else? Send us a message — we usually
            reply within one business day.
          </p>
        </div>
      </section>

      <div className="container-site py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Form */}
          <div>
            <ContactForm />
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-leaf-600/30 bg-leaf-600/10 px-5 py-4">
              <Clock size={18} className="shrink-0 text-leaf-400" />
              <p className="text-sm text-bark-700">
                We usually respond within <span className="font-semibold text-bark-900">one business day</span>.
                For order issues, keep your order number handy.
              </p>
            </div>
          </div>

          {/* Contact methods */}
          <aside className="space-y-4">
            <div className="card overflow-hidden">
              <div className="bg-forest-800 px-6 py-4">
                <h2 className="font-serif text-lg text-white">Reach Us Directly</h2>
              </div>
              <ul className="divide-y divide-bark-800/10">
                {methods.map(({ label, value, href, Icon }) => {
                  const inner = (
                    <>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf-50 text-leaf-600">
                        <Icon size={17} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-bark-400">
                          {label}
                        </p>
                        <p className="truncate text-sm text-bark-700 group-hover:text-bark-900">
                          {value}
                        </p>
                      </div>
                    </>
                  );
                  return (
                    <li key={label}>
                      {href ? (
                        <a
                          href={href}
                          target={href.startsWith("http") ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="group flex items-center gap-3.5 px-6 py-4 transition hover:bg-bark-800/10"
                        >
                          {inner}
                        </a>
                      ) : (
                        <div className="group flex items-center gap-3.5 px-6 py-4">{inner}</div>
                      )}
                    </li>
                  );
                })}
                {methods.length === 0 && (
                  <li className="px-6 py-6 text-sm text-bark-500">
                    Contact details will appear here once configured in admin settings.
                  </li>
                )}
              </ul>
            </div>

            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-accent w-full"
              >
                <MessageCircle size={16} /> Chat on WhatsApp
              </a>
            )}

            <div className="rounded-xl border border-caramel-500/30 bg-caramel-500/10 px-5 py-4">
              <p className="text-sm leading-relaxed text-bark-700">
                <span className="font-semibold text-bark-900">Looking for order help?</span>{" "}
                Mention your order number in the message and we will get right on it.
              </p>
            </div>
          </aside>
        </div>

        {/* FAQ */}
        <section className="mt-16">
          <div className="mb-8 text-center">
            <p className="eyebrow mb-2">FAQ</p>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
            {FAQS.map(({ q, a, Icon }) => (
              <details key={q} className="card group px-5 py-4 sm:col-span-1 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-bark-900">
                  <span className="flex items-center gap-2.5">
                    <Icon size={16} className="shrink-0 text-leaf-400" />
                    {q}
                  </span>
                  <span className="text-lg font-light text-caramel-400 transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 border-t border-bark-800/10 pt-3 text-sm leading-relaxed text-bark-600">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
