"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Phone, ShoppingBag, Store } from "lucide-react";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";

/** Mobile-only bottom navigation. Hidden on tablets and desktops. */
export function BottomNav() {
  const pathname = usePathname();
  const items = useCart((s) => s.items);
  const count = items.reduce((n, i) => n + i.quantity, 0);

  if (pathname?.startsWith("/admin")) return null;

  const openCart = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("mj:open-cart"));
  };

  const linkClass = (active: boolean) =>
    cn(
      "flex min-h-[4rem] flex-col items-center justify-center gap-1 text-[10px] font-bold transition",
      active ? "text-caramel-700" : "text-bark-500 hover:text-bark-800"
    );

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-bark-800/10 bg-ivory-50/95 backdrop-blur-md lg:hidden"
    >
      <div className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        <Link href="/" className={linkClass(pathname === "/")} aria-current={pathname === "/" ? "page" : undefined}>
          <Home size={21} />
          Home
        </Link>
        <Link
          href="/shop"
          className={linkClass(pathname === "/shop" || pathname?.startsWith("/product"))}
          aria-current={pathname === "/shop" ? "page" : undefined}
        >
          <Store size={21} />
          Shop
        </Link>
        <button type="button" onClick={openCart} className={linkClass(pathname === "/cart")} aria-label={`Open cart, ${count} items`}>
          <span className="relative">
            <ShoppingBag size={21} />
            {count > 0 && (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-chilli-600 px-0.5 text-[9px] font-bold text-white">
                {count}
              </span>
            )}
          </span>
          Cart
        </button>
        <Link href="/contact" className={linkClass(pathname === "/contact")} aria-current={pathname === "/contact" ? "page" : undefined}>
          <Phone size={21} />
          Contact
        </Link>
      </div>
    </nav>
  );
}
