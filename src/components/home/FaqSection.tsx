import Link from "next/link";
import { Accordion } from "@/components/ui/Accordion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { siteConfig, SITE_URL } from "@config/site";

export function FaqSection() {
  const items = [
    {
      q: "Are all your products really eggless?",
      a: "Yes — every single product is 100% eggless, always. Our kitchen never uses egg in any recipe, so vegetarians and those avoiding egg can order anything on the menu with confidence.",
    },
    {
      q: "What is the shelf life, and how should I store products?",
      a: "Shelf life varies by product and the best-before date is printed on every pack. As a rule, keep everything in an airtight container in a cool, dry place away from sunlight. Detailed storage instructions are on each product page.",
    },
    {
      q: "How long does shipping take?",
      a: `Orders are prepared fresh and dispatched quickly. Delivery typically takes ${siteConfig.pincodeEtaDefault} depending on your location — metros are usually faster. You receive tracking details as soon as your order ships.`,
    },
    {
      q: "Do you offer Cash on Delivery (COD)?",
      a: siteConfig.codAvailable
        ? "Yes — you can choose Cash on Delivery or pay securely online at checkout."
        : "Currently we accept secure online payments (UPI, cards and netbanking) at checkout. Your payment details are encrypted and never stored on our servers.",
    },
    {
      q: "Do your products contain allergens?",
      a: "Many of our products contain nuts, sesame, milk (ghee/butter) and gluten-containing millets. Every product page lists detailed allergen information — please check it before ordering if you have an allergy.",
    },
    {
      q: "Can I order in bulk for gifting, weddings or corporate hampers?",
      a: "Absolutely — festive hampers and bulk orders are a speciality. Message us on WhatsApp with your quantity and occasion, and we will curate gift boxes, add personalised notes and arrange careful packing.",
    },
    {
      q: "Is everything sweetened only with jaggery?",
      a: "Yes. We never use refined white sugar in any product — only slow-boiled original jaggery (and the natural sweetness of ingredients like coconut and dry fruits).",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section className="container-site py-16 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ ...jsonLd, url: `${SITE_URL}/#faq` }) }}
      />
      <SectionHeader
        eyebrow="Good to Know"
        title="Frequently Asked Questions"
        align="center"
      />
      <div className="mx-auto max-w-3xl scroll-mt-28" id="faq">
        <Accordion items={items.map((item) => ({ title: item.q, body: item.a }))} />
        <p className="mt-6 text-center text-sm text-bark-600">
          Still curious?{" "}
          <Link href="/contact" className="font-semibold text-caramel-700 hover:text-caramel-600">
            Ask us anything →
          </Link>
        </p>
      </div>
    </section>
  );
}
