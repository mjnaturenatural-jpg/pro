"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";
import { SearchOverlay } from "@/components/ui/SearchOverlay";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { BrandLogo } from "@/components/layout/Logo";
import { WhatsAppIcon as WhatsAppGlyph } from "@/components/ui/WhatsAppIcon";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { DEFAULT_WHATSAPP_MESSAGE, getWhatsAppLink } from "@/lib/whatsapp";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export interface HeaderCategory {
  name: string;
  slug: string;
  image?: string;
  description?: string;
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
  categories?: HeaderCategory[];
}) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const items = useCart((s) => s.items);
  const count = items.reduce((n, i) => n + i.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const open = () => setCartOpen(true);
    window.addEventListener("mj:open-cart", open);
    return () => window.removeEventListener("mj:open-cart", open);
  }, []);

  const isAdmin = pathname?.startsWith("/admin");
  if (isAdmin) return null;

  const waHref = getWhatsAppLink(DEFAULT_WHATSAPP_MESSAGE, whatsapp || undefined);

  return (
    <>
      {announcement.enabled && announcement.text && <AnnouncementBar adminText={announcement.text} />}
      {!announcement.enabled && <AnnouncementBar />}
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          scrolled
            ? "border-bark-800/10 bg-ivory-50/95 shadow-soft backdrop-blur-md"
            : "border-transparent bg-ivory-50/60 backdrop-blur-sm"
        )}
      >
        <div className={cn("container-site flex items-center justify-between gap-4 transition-all duration-300", scrolled ? "h-14" : "h-16 sm:h-[72px]")}>
          <Link href="/" aria-label={`${brandName} home`}>
            <BrandLogo logo={logo} brandName={brandName} />
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex" aria-label="Main navigation">
            {NAV.map((item) => {
              const active = pathname === item.href;
              if (item.label === "Shop" && categories.length > 0) {
                return (
                  <div key={item.href} className="group relative">
                    <Link
                      href={item.href}
                      aria-haspopup="true"
                      className={cn(
                        "relative flex items-center gap-1 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-bark-700 transition hover:text-caramel-700",
                        active && "text-caramel-700"
                      )}
                    >
                      {item.label}
                      <ChevronDown size={14} className="transition group-hover:rotate-180" />
                      {active && (
                        <span className="absolute -bottom-0.5 left-0 h-0.5 w-full rounded bg-caramel-500" />
                      )}
                    </Link>
                    <div className="invisible absolute left-1/2 top-full z-50 w-[560px] max-w-[calc(100vw-2rem)] -translate-x-1/2 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      <div className="overflow-hidden rounded-2xl border border-bark-800/10 bg-ivory-100 p-3 shadow-lift">
                        <div className="grid grid-cols-2 gap-1">
                          {categories.map((c) => (
                            <Link
                              key={c.slug}
                              href={`/shop?category=${c.slug}`}
                              className="group/item flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-caramel-50"
                            >
                              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-sand-100">
                                {c.image ? (
                                  <Image src={c.image} alt="" fill sizes="44px" className="object-cover" />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center font-serif text-sm font-bold text-caramel-700">
                                    {c.name.charAt(0)}
                                  </span>
                                )}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-bark-800 group-hover/item:text-caramel-700">
                                  {c.name}
                                </span>
                                {c.description && (
                                  <span className="block truncate text-[11px] text-bark-500">
                                    {c.description}
                                  </span>
                                )}
                              </span>
                            </Link>
                          ))}
                        </div>
                        <Link
                          href="/shop"
                          className="mt-2 flex items-center justify-center gap-1 rounded-xl bg-brown-900 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-ivory-50 transition hover:bg-brown-800"
                        >
                          Shop all products →
                        </Link>
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
                    "relative py-2 text-sm font-semibold uppercase tracking-[0.08em] text-bark-700 transition hover:text-caramel-700",
                    active && "text-caramel-700"
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
                className="hidden p-2 text-[#25D366] transition hover:text-[#1EBE5A] sm:block"
              >
                <WhatsAppGlyph />
              </a>
            )}
            <button
              onClick={() => setSearchOpen(true)}
              className="min-h-[44px] min-w-[44px] p-2 text-bark-700 transition hover:text-caramel-700"
              aria-label="Search products"
            >
              <Search size={20} />
            </button>
            <button
              onClick={() => setCartOpen(true)}
              className="relative min-h-[44px] min-w-[44px] p-2 text-bark-700 transition hover:text-caramel-700"
              aria-label={`Open cart, ${count} items`}
            >
              <ShoppingBag size={20} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-chilli-600 px-1 text-[10px] font-bold text-white"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
