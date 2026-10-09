import Link from "next/link";
import { Instagram, Facebook, Youtube, Mail, Phone } from "lucide-react";
import { getSettings } from "@/lib/queries";

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

  const brandName = (settings.brandName as string) || "MJ Nature Naturals";
  const email = (settings.contactEmail as string) || "";
  const phone = (settings.phone as string) || "";
  const instagram = (settings.instagram as string) || "";
  const facebook = (settings.facebook as string) || "";
  const youtube = (settings.youtube as string) || "";
  const address = (settings.address as string) || "";

  return (
    <footer className="mt-20 border-t border-bark-800/10 bg-cream">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-600 font-serif text-sm font-semibold text-white">
              MJ
            </span>
            <span className="font-serif text-lg font-semibold text-bark-900">{brandName}</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-bark-600">
            Premium natural foods crafted with thoughtfully selected ingredients.
          </p>
          <div className="flex gap-3">
            {instagram && (
              <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-bark-600 hover:text-caramel-400">
                <Instagram size={18} />
              </a>
            )}
            {facebook && (
              <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-bark-600 hover:text-caramel-400">
                <Facebook size={18} />
              </a>
            )}
            {youtube && (
              <a href={youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-bark-600 hover:text-caramel-400">
                <Youtube size={18} />
              </a>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-bark-700">
            Navigation
          </h3>
          <ul className="space-y-2.5">
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
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-bark-700">
            Customer Care
          </h3>
          <ul className="space-y-2.5">
            {CARE_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-bark-600 transition hover:text-bark-900">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-bark-700">
            Get in Touch
          </h3>
          <ul className="space-y-3">
            {email && (
              <li className="flex items-start gap-2.5 text-sm text-bark-600">
                <Mail size={15} className="mt-0.5 shrink-0 text-caramel-500" />
                <a href={`mailto:${email}`} className="hover:text-bark-900 break-all">
                  {email}
                </a>
              </li>
            )}
            {phone && (
              <li className="flex items-start gap-2.5 text-sm text-bark-600">
                <Phone size={15} className="mt-0.5 shrink-0 text-caramel-500" />
                <a href={`tel:${phone}`} className="hover:text-bark-900">
                  {phone}
                </a>
              </li>
            )}
            {address && <li className="text-sm leading-relaxed text-bark-600">{address}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-bark-800/10">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-5 text-xs text-bark-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
          <p>Natural foods · Crafted with care</p>
        </div>
      </div>
    </footer>
  );
}
