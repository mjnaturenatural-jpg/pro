import Link from "next/link";
import { Instagram, Facebook, Youtube, Mail, Phone, ShieldCheck, BadgeCheck } from "lucide-react";
import { getSettings } from "@/lib/queries";
import { BrandLogo } from "@/components/layout/Logo";

const SHOP_LINKS = [
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
];

export async function Footer() {
  let settings: Record<string, unknown> = {};
  try {
    settings = await getSettings();
  } catch {
    settings = {};
  }

  const brandName = (settings.brandName as string) || "MJ Nature Natural";
  const logo = (settings.logo as string) || "";
  const email = (settings.contactEmail as string) || "";
  const phone = (settings.phone as string) || "";
  const whatsapp = (settings.whatsapp as string) || "";
  const instagram = (settings.instagram as string) || "";
  const facebook = (settings.facebook as string) || "";
  const youtube = (settings.youtube as string) || "";
  const address = (settings.address as string) || "";
  const gstNumber = (settings.gstNumber as string) || "";
  const foodLicence = (settings.foodLicence as string) || "";

  return (
    <footer className="mt-14 bg-gradient-to-b from-ivory-50 to-honey-100/40">
      <div className="h-1 bg-gradient-to-r from-caramel-500 via-honey-300 to-leaf-500" />
      <div className="container-site grid gap-7 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Link href="/">
            <BrandLogo logo={logo} brandName={brandName} />
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-bark-600">
            Premium natural foods crafted with thoughtfully selected ingredients.
          </p>
          <div className="flex gap-2.5">
            {instagram && (
              <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory-100 text-bark-600 shadow-sm ring-1 ring-bark-800/10 transition hover:-translate-y-0.5 hover:text-caramel-600 hover:ring-caramel-500/30">
                <Instagram size={17} />
              </a>
            )}
            {facebook && (
              <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory-100 text-bark-600 shadow-sm ring-1 ring-bark-800/10 transition hover:-translate-y-0.5 hover:text-caramel-600 hover:ring-caramel-500/30">
                <Facebook size={17} />
              </a>
            )}
            {youtube && (
              <a href={youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="flex h-9 w-9 items-center justify-center rounded-full bg-ivory-100 text-bark-600 shadow-sm ring-1 ring-bark-800/10 transition hover:-translate-y-0.5 hover:text-caramel-600 hover:ring-caramel-500/30">
                <Youtube size={17} />
              </a>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-bark-700">
            Navigation
          </h3>
          <ul className="space-y-2">
            {SHOP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-bark-600 transition hover:text-bark-900">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-bark-700">
            Customer Care
          </h3>
          <ul className="space-y-2">
            {CARE_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-bark-600 transition hover:text-bark-900">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <h3 className="mb-4 mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-bark-700">
            Reach Us
          </h3>
          <ul className="space-y-2">
            {phone && (
              <li className="flex items-start gap-2.5 text-sm text-bark-600">
                <Phone size={15} className="mt-0.5 shrink-0 text-caramel-500" />
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="hover:text-bark-900">
                  {phone}
                </a>
              </li>
            )}
            {whatsapp && (
              <li className="flex items-start gap-2.5 text-sm text-bark-600">
                <Phone size={15} className="mt-0.5 shrink-0 text-caramel-500" />
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-bark-900"
                >
                  WhatsApp
                </a>
              </li>
            )}
            {email && (
              <li className="flex items-start gap-2.5 text-sm text-bark-600">
                <Mail size={15} className="mt-0.5 shrink-0 text-caramel-500" />
                <a href={`mailto:${email}`} className="hover:text-bark-900 break-all">
                  {email}
                </a>
              </li>
            )}
            {address && <li className="text-sm leading-relaxed text-bark-600">{address}</li>}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-bark-700">
            Business Information
          </h3>
          <ul className="space-y-2">
            {foodLicence && (
              <li className="flex items-start gap-2.5 text-sm text-bark-600">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-leaf-600" />
                <span>
                  <span className="block text-[11px] uppercase tracking-wide text-bark-500">
                    Food Licence
                  </span>
                  {foodLicence}
                </span>
              </li>
            )}
            {gstNumber && (
              <li className="flex items-start gap-2.5 text-sm text-bark-600">
                <BadgeCheck size={15} className="mt-0.5 shrink-0 text-leaf-600" />
                <span>
                  <span className="block text-[11px] uppercase tracking-wide text-bark-500">
                    GSTIN
                  </span>
                  {gstNumber}
                </span>
              </li>
            )}
            {!foodLicence && !gstNumber && (
              <li className="text-sm leading-relaxed text-bark-500">
                Business registration details are being updated.
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-bark-800/10">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-4 text-xs text-bark-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
          <p>Natural foods · Crafted with care</p>
        </div>
      </div>
    </footer>
  );
}
