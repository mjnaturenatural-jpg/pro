import Link from "next/link";
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin, Clock, ShieldCheck, BadgeCheck } from "lucide-react";
import { getSettings } from "@/lib/queries";
import { DEFAULT_WHATSAPP_MESSAGE, getWhatsAppLink } from "@/lib/whatsapp";
import { siteConfig } from "@config/site";
import { BrandLogo } from "@/components/layout/Logo";
import { FooterNewsletter } from "@/components/layout/FooterNewsletter";
import { BackToTop } from "@/components/layout/BackToTop";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const CARE_LINKS = [
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Contact Us", href: "/contact" },
];

export async function Footer() {
  let settings: Record<string, unknown> = {};
  try {
    settings = await getSettings();
  } catch {
    settings = {};
  }

  const brandName = (settings.brandName as string) || siteConfig.brandName;
  const logo = (settings.logo as string) || "";
  const email = (settings.contactEmail as string) || siteConfig.email;
  const phone = (settings.phone as string) || siteConfig.phone;
  const phoneHref = phone
    ? (settings.phone ? (phone as string).replace(/[^\d+]/g, "") : siteConfig.phoneHref)
    : "";
  const whatsapp = (settings.whatsapp as string) || "";
  const waHref = getWhatsAppLink(DEFAULT_WHATSAPP_MESSAGE, whatsapp || undefined);
  const instagram = (settings.instagram as string) || siteConfig.instagram;
  const facebook = (settings.facebook as string) || siteConfig.facebook;
  const youtube = (settings.youtube as string) || siteConfig.youtube;
  const address = (settings.address as string) || siteConfig.address;
  const hours = siteConfig.hours;
  const gstNumber = (settings.gstNumber as string) || siteConfig.gstin;
  const foodLicence = (settings.foodLicence as string) || siteConfig.fssai;
  const hasBusinessIds = Boolean(foodLicence || gstNumber);

  return (
    <footer className="mt-14 bg-brown-900 text-ivory-50/80">
      <div className="h-1 bg-gradient-to-r from-caramel-500 via-turmeric-400 to-leaf-500" />
      <div className="container-site grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Link href="/" aria-label={`${brandName} home`}>
            <BrandLogo logo={logo} brandName={brandName} tone="dark" />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-ivory-50/70">
            Small-batch laddus, chikkis, cookies and brownies — 100% eggless, no maida, sweetened
            only with original jaggery.
          </p>
          <div className="flex gap-2.5">
            {instagram && (
              <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-ivory-50/80 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-caramel-600 hover:text-white">
                <Instagram size={17} />
              </a>
            )}
            {facebook && (
              <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-ivory-50/80 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-caramel-600 hover:text-white">
                <Facebook size={17} />
              </a>
            )}
            {youtube && (
              <a href={youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-ivory-50/80 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-caramel-600 hover:text-white">
                <Youtube size={17} />
              </a>
            )}
          </div>
          <FooterNewsletter offer={siteConfig.newsletterOffer} />
        </div>

        <nav aria-label="Footer navigation">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-turmeric-300">
            Shop
          </h3>
          <ul className="space-y-2.5">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-ivory-50/75 transition hover:text-turmeric-300">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Customer care">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-turmeric-300">
            Customer Care
          </h3>
          <ul className="space-y-2.5">
            {CARE_LINKS.map((l) => (
              <li key={l.href + l.label}>
                <Link href={l.href} className="text-sm text-ivory-50/75 transition hover:text-turmeric-300">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {hasBusinessIds && (
            <>
              <h3 className="mb-3 mt-7 text-xs font-bold uppercase tracking-[0.18em] text-turmeric-300">
                Business Information
              </h3>
              <ul className="space-y-2.5">
                {foodLicence && (
                  <li className="flex items-start gap-2 text-sm text-ivory-50/75">
                    <ShieldCheck size={15} className="mt-0.5 shrink-0 text-leaf-200" />
                    <span>
                      <span className="block text-[11px] uppercase tracking-wide text-ivory-50/50">
                        FSSAI Lic. No.
                      </span>
                      {foodLicence}
                    </span>
                  </li>
                )}
                {gstNumber && (
                  <li className="flex items-start gap-2 text-sm text-ivory-50/75">
                    <BadgeCheck size={15} className="mt-0.5 shrink-0 text-leaf-200" />
                    <span>
                      <span className="block text-[11px] uppercase tracking-wide text-ivory-50/50">
                        GSTIN
                      </span>
                      {gstNumber}
                    </span>
                  </li>
                )}
              </ul>
            </>
          )}
        </nav>

        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-turmeric-300">
            Reach Us
          </h3>
          <ul className="space-y-3">
            {phoneHref && (
              <li className="flex items-start gap-2.5 text-sm">
                <Phone size={15} className="mt-0.5 shrink-0 text-caramel-300" />
                <a href={`tel:${phoneHref}`} className="text-ivory-50/80 hover:text-turmeric-300">
                  {phone}
                </a>
              </li>
            )}
            {waHref && (
              <li className="flex items-start gap-2.5 text-sm">
                <Phone size={15} className="mt-0.5 shrink-0 text-caramel-300" />
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="text-ivory-50/80 hover:text-turmeric-300">
                  Chat on WhatsApp
                </a>
              </li>
            )}
            {email && (
              <li className="flex items-start gap-2.5 text-sm">
                <Mail size={15} className="mt-0.5 shrink-0 text-caramel-300" />
                <a href={`mailto:${email}`} className="break-all text-ivory-50/80 hover:text-turmeric-300">
                  {email}
                </a>
              </li>
            )}
            {address && (
              <li className="flex items-start gap-2.5 text-sm leading-relaxed text-ivory-50/75">
                <MapPin size={15} className="mt-0.5 shrink-0 text-caramel-300" />
                <span>{address}</span>
              </li>
            )}
            {hours && (
              <li className="flex items-start gap-2.5 text-sm text-ivory-50/75">
                <Clock size={15} className="mt-0.5 shrink-0 text-caramel-300" />
                <span>{hours}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-4 text-xs text-ivory-50/60 sm:flex-row">
          <p>© {new Date().getFullYear()} {brandName}. All rights reserved.</p>
          <p>Natural foods · Crafted with care</p>
        </div>
      </div>
      <BackToTop />
    </footer>
  );
}
