"use client";

import { usePathname } from "next/navigation";
import { DEFAULT_WHATSAPP_MESSAGE, getWhatsAppLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

export function WhatsAppButton({ whatsapp = "" }: { whatsapp?: string }) {
  const pathname = usePathname() || "";

  if (pathname.startsWith("/admin")) return null;

  const href = getWhatsAppLink(DEFAULT_WHATSAPP_MESSAGE, whatsapp || undefined);
  if (!href) return null;

  return (
    <span className="group fixed bottom-24 right-5 z-50 sm:bottom-5">
      <span
        aria-hidden="true"
        className="wa-ping absolute inset-0 rounded-full bg-[#25D366]"
      />
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition duration-200 hover:scale-105 hover:bg-[#1EBE5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      >
        <WhatsAppIcon size={28} />
      </a>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-bark-900 px-3 py-1.5 text-xs font-semibold text-ivory-50 opacity-0 shadow-lift transition group-hover:opacity-100"
      >
        Chat with us
      </span>
    </span>
  );
}
