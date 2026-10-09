"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/store/cart";
import { SearchOverlay } from "@/components/ui/SearchOverlay";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Header({ announcement }: { announcement: { enabled: boolean; text: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const items = useCart((s) => s.items);
  const count = items.reduce((n, i) => n + i.quantity, 0);

  const isAdmin = pathname?.startsWith("/admin");
  if (isAdmin) return null;

  return (
    <>
      {announcement.enabled && announcement.text && (
        <div className="bg-bark-800 text-ivory-100">
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

          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-600 font-serif text-sm font-semibold text-white">
              MJ
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-serif text-lg font-semibold text-bark-900 sm:text-xl">
                MJ Nature
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-caramel-600">
                Naturals
              </span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative text-sm font-medium text-bark-700 transition hover:text-bark-900 py-2",
                  pathname === item.href && "text-bark-900"
                )}
              >
                {item.label}
                {pathname === item.href && (
                  <span className="absolute -bottom-0.5 left-0 h-0.5 w-full rounded bg-caramel-500" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
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
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-leaf-600 px-1 text-[10px] font-bold text-white">
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
          <div className="absolute inset-0 bg-bark-900/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-ivory-50 shadow-lift animate-fadeIn">
            <div className="flex items-center justify-between border-b border-bark-800/10 px-5 h-16">
              <span className="font-serif text-lg font-semibold text-bark-900">{APP_NAME}</span>
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
                    "rounded-lg px-4 py-3 text-base font-medium text-bark-800 hover:bg-sand-50",
                    pathname === item.href && "bg-sand-50 text-bark-900"
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-3 border-t border-bark-800/10" />
              <Link
                href="/cart"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-base font-medium text-bark-800 hover:bg-sand-50"
              >
                Cart ({count})
              </Link>
            </nav>
          </div>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
