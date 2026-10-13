"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_NUMBER, WHATSAPP_MESSAGE } from "@/lib/constants";

export function WhatsAppButton({ whatsapp = "" }: { whatsapp?: string }) {
  const pathname = usePathname() || "";

  if (pathname.startsWith("/admin")) return null;

  const number = (whatsapp || WHATSAPP_NUMBER).replace(/\D/g, "");
  if (!number) return null;

  const href = `https://wa.me/${number}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lift transition duration-200 hover:scale-105 hover:bg-[#1EBE5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
    >
      <MessageCircle size={26} fill="currentColor" strokeWidth={1.5} />
    </a>
  );
}
