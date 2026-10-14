import { Mail, Phone, MapPin, MessageCircle, Clock } from "lucide-react";
import { getSettings } from "@/lib/queries";
import { DEFAULT_WHATSAPP_MESSAGE, getWhatsAppLink } from "@/lib/whatsapp";
import { siteConfig } from "@config/site";
import { ContactForm } from "@/components/contact/ContactForm";
import { Accordion } from "@/components/ui/Accordion";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Metadata } from "next";
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with MJ Nature Natural — we're here to help with orders, products and queries.",
};

const FAQS = [
  {
    q: "How long does delivery take?",
    a: "Orders are prepared and dispatched within a few business days. Exact delivery timelines for your pin code are shown at checkout, and you receive a tracking link once your order ships.",
  },
  {
    q: "How should I store the products?",
    a: "Keep them in an airtight container in a cool, dry place, away from direct sunlight. Each product page carries specific storage instructions.",
  },
  {
    q: "Do your products contain allergens?",
    a: "Many of our products contain nuts, sesame and dairy. Every product page lists detailed allergen information — please check it before ordering if you have an allergy.",
  },
  {
    q: "How do I track my order?",
    a: "You will receive order updates by email, and a tracking link is shared once the order is dispatched. For any issues, reach out to us with your order number.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept secure online payments at checkout. Your payment details are encrypted and never stored on our servers.",
  },
];

export default async function ContactPage() {
  const settings = await getSettings();
  const email = (settings.contactEmail as string) || siteConfig.email;
  const phone = (settings.phone as string) || siteConfig.phone;
  const phoneHref = phone
    ? ((settings.phone as string) ? phone.replace(/[^\d+]/g, "") : siteConfig.phoneHref)
    : "";
  const whatsapp = (settings.whatsapp as string) || "";
  const address = (settings.address as string) || siteConfig.address;
  const hours = siteConfig.hours;
  const waCtaHref = getWhatsAppLink(DEFAULT_WHATSAPP_MESSAGE, whatsapp || undefined);

  const methods = [
    email && { label: "Email", value: email, href: `mailto:${email}`, Icon: Mail },
    phoneHref && { label: "Phone", value: phone, href: `tel:${phoneHref}`, Icon: Phone },
    hours && { label: "Hours", value: hours, href: "", Icon: Clock },
    whatsapp && {
      label: "WhatsApp",
      value: "Chat with us",
      href: getWhatsAppLink(DEFAULT_WHATSAPP_MESSAGE, whatsapp),
      Icon: MessageCircle,
    },
    address && { label: "Address", value: address, href: "", Icon: MapPin },
  ].filter(Boolean) as { label: string; value: string; href: string; Icon: typeof Mail }[];

  return (
    <>
      {/* Hero */}
      <section className="grain relative overflow-hidden bg-brown-900">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-caramel-500/20 blur-3xl" />
          <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-turmeric-400/10 blur-3xl" />
        </div>
        <div className="container-site relative py-14 sm:py-20">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Contact" }]}
          />
          <div className="max-w-2xl">
            <p className="mb-3 inline-flex rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-turmeric-300 ring-1 ring-white/15">
              Contact
            </p>
            <h1 className="font-serif text-3xl font-bold leading-tight text-ivory-50 sm:text-5xl">
              We&apos;d love to <em className="italic text-turmeric-300">hear from you</em>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-ivory-50/75 sm:text-base">
              Questions about an order, a product or anything else? Send us a message — we usually
              reply within one business day.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {phoneHref && (
                <a href={`tel:${phoneHref}`} className="btn min-h-[48px] bg-ivory-50 px-6 py-3 text-sm font-bold text-brown-900 transition hover:-translate-y-0.5 hover:bg-white">
                  <Phone size={15} /> {phone}
                </a>
              )}
              {waCtaHref && (
                <a
                  href={waCtaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn min-h-[48px] bg-[#25D366] px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#1EBE5A]"
                >
                  <MessageCircle size={15} /> WhatsApp Us
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-caramel-500 via-turmeric-400 to-leaf-500" />
      </section>

      <div className="container-site py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Form */}
          <div className="rounded-[28px] border border-bark-800/10 bg-ivory-100 p-6 shadow-soft sm:p-8">
            <h2 className="font-serif text-2xl font-bold text-bark-900">Send a message</h2>
            <p className="mt-1.5 text-sm text-bark-500">
              Fill this in and we&apos;ll get back to you shortly.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-leaf-200 bg-leaf-50 px-5 py-4">
              <Clock size={18} className="shrink-0 text-leaf-600" />
              <p className="text-sm text-bark-700">
                We usually respond within <span className="font-semibold text-bark-900">one business day</span>.
                For order issues, keep your order number handy.
              </p>
            </div>
          </div>

          {/* Info panel */}
          <aside className="h-fit overflow-hidden rounded-[28px] bg-brown-900 shadow-lift lg:sticky lg:top-24">
            <div className="px-6 pb-2 pt-6">
              <h2 className="font-serif text-xl font-bold text-ivory-50">Reach us directly</h2>
            </div>
            <ul className="divide-y divide-white/10">
              {methods.map(({ label, value, href, Icon }) => {
                const inner = (
                  <>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-turmeric-300">
                      <Icon size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ivory-50/50">
                        {label}
                      </p>
                      <p className="truncate text-sm font-medium text-ivory-50/90">
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
                        className="flex items-center gap-3.5 px-6 py-4 transition hover:bg-white/5"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div className="flex items-center gap-3.5 px-6 py-4">{inner}</div>
                    )}
                  </li>
                );
              })}
              {methods.length === 0 && (
                <li className="px-6 py-6 text-sm text-ivory-50/60">
                  Contact details will appear here once configured in admin settings.
                </li>
              )}
            </ul>

            <div className="px-6 pb-6">
              {waCtaHref && (
                <a
                  href={waCtaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn mt-2 w-full bg-[#25D366] py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#1EBE5A]"
                >
                  <MessageCircle size={16} /> Chat on WhatsApp
                </a>
              )}
              <div className="mt-4 overflow-hidden rounded-2xl">
                {siteConfig.mapEmbedUrl ? (
                  <iframe
                    title="Store location map"
                    src={siteConfig.mapEmbedUrl}
                    className="h-44 w-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-32 flex-col items-center justify-center gap-2 border border-dashed border-white/20 bg-white/5 px-6 text-center">
                    <MapPin size={22} className="text-turmeric-300" />
                    <p className="text-xs font-semibold text-ivory-50/70">
                      Find us across India — detailed map coming soon.
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4 rounded-2xl bg-white/5 px-5 py-4 ring-1 ring-white/10">
                <p className="text-sm leading-relaxed text-ivory-50/80">
                  <span className="font-bold text-ivory-50">Looking for order help?</span>{" "}
                  Mention your order number in the message and we will get right on it.
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* FAQ */}
        <section className="mx-auto mt-16 max-w-3xl">
          <p className="eyebrow mb-2 text-center">FAQ</p>
          <h2 className="text-center font-serif text-2xl font-bold text-bark-900 sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-8">
            <Accordion items={FAQS.map((f) => ({ title: f.q, body: f.a }))} />
          </div>
        </section>
      </div>
    </>
  );
}
