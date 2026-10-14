"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, Search, ShoppingBag, X } from "lucide-react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [shopExpanded, setShopExpanded] = useState(false);
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
          <button
            className="-ml-1 min-h-[44px] min-w-[44px] p-2 text-bark-800 lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Menu size={22} />
          </button>

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

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brown-900/50"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto bg-ivory-50 shadow-lift"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
              <div className="flex h-16 items-center justify-between border-b border-bark-800/10 px-5">
                <span className="font-serif text-lg font-semibold text-bark-900">{brandName}</span>
                <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-bark-800/5">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex flex-col gap-1 p-5" aria-label="Mobile navigation">
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3.5 text-base font-semibold text-bark-800 hover:bg-caramel-500/10"
                >
                  Home
                </Link>
                <button
                  type="button"
                  onClick={() => setShopExpanded((v) => !v)}
                  aria-expanded={shopExpanded}
                  className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-semibold text-bark-800 hover:bg-caramel-500/10"
                >
                  Shop
                  <ChevronDown size={18} className={cn("transition", shopExpanded && "rotate-180")} />
                </button>
                <AnimatePresence initial={false}>
                  {shopExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-0.5 pb-1 pl-3">
                        <Link
                          href="/shop"
                          onClick={() => setMenuOpen(false)}
                          className="rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-wide text-caramel-700 hover:bg-caramel-500/10"
                        >
                          Shop All
                        </Link>
                        {categories.map((c) => (
                          <Link
                            key={c.slug}
                            href={`/shop?category=${c.slug}`}
                            onClick={() => setMenuOpen(false)}
                            className="rounded-lg px-4 py-3 text-[15px] font-medium text-bark-700 hover:bg-caramel-500/10"
                          >
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {[
                  { label: "About", href: "/about" },
                  { label: "Contact", href: "/contact" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-3.5 text-base font-semibold text-bark-800 hover:bg-caramel-500/10"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-3 border-t border-bark-800/10" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setCartOpen(true);
                  }}
                  className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-semibold text-bark-800 hover:bg-caramel-500/10"
                >
                  Cart
                  {count > 0 && (
                    <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-chilli-600 px-1.5 text-xs font-bold text-white">
                      {count}
                    </span>
                  )}
                </button>
                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-4 py-3.5 text-base font-semibold text-[#1EBE5A] hover:bg-caramel-500/10"
                  >
                    <WhatsAppGlyph size={18} /> Chat on WhatsApp
                  </a>
                )}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
