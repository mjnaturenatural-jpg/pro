"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Tags,
  Users,
  Ticket,
  Star,
  FileText,
  Warehouse,
  Settings,
  X,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: Package },
  { label: "Products", href: "/admin/products", icon: Boxes },
  { label: "Categories", href: "/admin/categories", icon: Tags },
  { label: "Inventory", href: "/admin/inventory", icon: Warehouse },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Content", href: "/admin/content", icon: FileText },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-4">
      {NAV.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-bark-800 text-ivory-50"
                : "text-bark-600 hover:bg-sand-50 hover:text-bark-900"
            )}
          >
            <item.icon size={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-bark-800/10 bg-white lg:flex">
        <Link href="/" className="flex h-16 items-center gap-2.5 border-b border-bark-800/10 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-leaf-600 text-xs font-bold text-white">
            MJ
          </span>
          <div className="leading-tight">
            <p className="font-serif text-sm font-semibold text-bark-900">MJ Nature Naturals</p>
            <p className="text-[10px] uppercase tracking-widest text-caramel-600">Admin Panel</p>
          </div>
        </Link>
        {nav}
        <div className="border-t border-bark-800/10 p-4">
          <Link href="/" className="text-xs text-bark-500 hover:text-bark-800">
            ← View storefront
          </Link>
        </div>
      </aside>

      {/* Mobile */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-bark-800 text-ivory-50 shadow-lift lg:hidden"
        aria-label="Open admin menu"
      >
        <Menu size={20} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-bark-900/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-lift animate-fadeIn">
            <div className="flex h-16 items-center justify-between border-b border-bark-800/10 px-5">
              <p className="font-serif text-sm font-semibold text-bark-900">MJ Admin</p>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            {nav}
            <div className="border-t border-bark-800/10 p-4">
              <Link href="/" className="text-xs text-bark-500">
                ← View storefront
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
