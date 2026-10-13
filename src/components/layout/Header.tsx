"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/store/cart";
import { SearchOverlay } from "@/components/ui/SearchOverlay";
import { BrandLogo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";
import { APP_NAME, WHATSAPP_MESSAGE, WHATSAPP_NUMBER } from "@/lib/constants";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

function WhatsAppGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export function Header({
  announcement,
  logo = "",
  brandName = APP_NAME,
  whatsapp = "",
  categories = [],
}: {
  announcement: { enabled: boolean; text: string };
  logo?: string;
  brandName?: string;
  whatsapp?: string;
  categories?: { name: string; slug: string }[];
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const items = useCart((s) => s.items);
  const count = items.reduce((n, i) => n + i.quantity, 0);

  const isAdmin = pathname?.startsWith("/admin");
  if (isAdmin) return null;

  const waNumber = (whatsapp || WHATSAPP_NUMBER).replace(/\D/g, "");
  const waHref = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
    : "";

  return (
    <>
      {announcement.enabled && announcement.text && (
        <div className="bg-caramel-600 text-white">
          <div className="container-site flex h-9 items-center justify-center text-center text-xs tracking-wide">
            {announcement.text}
          </div>
        </div>
      )}
      <header className="sticky top-0 z-50 border-b border-bark-800/10 bg-ivory-50/90 backdrop-blur-md">
        <div className="container-site flex h-16 items-center justify-between gap-4 sm:h-[72px]">
          <button
            className="lg:hidden -ml-1 p-2 text-bark-800"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <Link href="/">
            <BrandLogo logo={logo} brandName={brandName} />
          </Link>

          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {NAV.map((item) => {
              const active = pathname === item.href;
              if (item.label === "Shop" && categories.length > 0) {
                return (
                  <div key={item.href} className="group relative">
                    <Link
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-1 py-2 text-sm font-medium text-bark-700 transition hover:text-bark-900",
                        active && "text-bark-900"
                      )}
                    >
                      {item.label}
                      <ChevronDown size={14} className="transition group-hover:rotate-180" />
                      {active && (
                        <span className="absolute -bottom-0.5 left-0 h-0.5 w-full rounded bg-caramel-500" />
                      )}
                    </Link>
                    <div className="invisible absolute left-1/2 top-full z-50 w-60 -translate-x-1/2 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100">
                      <div className="grid gap-0.5 rounded-xl border border-bark-800/10 bg-ivory-100 p-2 shadow-lift">
                        {categories.map((c) => (
                          <Link
                            key={c.slug}
                            href={`/shop?category=${c.slug}`}
                            className="rounded-lg px-3 py-2 text-sm text-bark-700 transition hover:bg-sand-100 hover:text-bark-900"
                          >
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative py-2 text-sm font-medium text-bark-700 transition hover:text-bark-900",
                    active && "text-bark-900"
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute -bottom-0.5 left-0 h-0.5 w-full rounded bg-caramel-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with us on WhatsApp"
                className="p-2 text-[#25D366] transition hover:text-[#1EBE5A]"
              >
                <WhatsAppGlyph />
              </a>
            )}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-bark-700 hover:text-bark-900"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            <Link
              href="/cart"
              className="relative p-2 text-bark-700 hover:text-bark-900"
              aria-label="Cart"
            >
              <ShoppingBag size={20} />
              {count > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-caramel-600 px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-forest-900/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-ivory-50 shadow-lift animate-fadeIn">
            <div className="flex items-center justify-between border-b border-bark-800/10 px-5 h-16">
              <span className="font-serif text-lg font-semibold text-bark-900">{brandName}</span>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="p-2">
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col p-5 gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "rounded-lg px-4 py-3 text-base font-medium text-bark-800 hover:bg-caramel-500/10",
                    pathname === item.href && "bg-caramel-500/15 text-bark-900"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {categories.length > 0 && (
                <>
                  <p className="mt-3 px-4 text-xs font-semibold uppercase tracking-[0.18em] text-bark-500">
                    Shop by Category
                  </p>
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/shop?category=${c.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-lg px-4 py-2.5 text-sm font-medium text-bark-700 hover:bg-caramel-500/10"
                    >
                      {c.name}
                    </Link>
                  ))}
                </>
              )}
              <div className="my-3 border-t border-bark-800/10" />
              <Link
                href="/cart"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-base font-medium text-bark-800 hover:bg-caramel-500/10"
              >
                Cart ({count})
              </Link>
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-4 py-3 text-base font-medium text-[#25D366] hover:bg-caramel-500/10"
                >
                  <WhatsAppGlyph size={18} /> Chat on WhatsApp
                </a>
              )}
            </nav>
          </div>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
