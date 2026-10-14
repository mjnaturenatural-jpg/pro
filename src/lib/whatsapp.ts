const ENV_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

export const DEFAULT_WHATSAPP_MESSAGE =
  "Hello MJ Nature Natural, I would like to know more about your products.";

/** Digits-only WhatsApp number. Empty string = not configured (hide CTAs). */
export function getWhatsAppNumber(explicit?: string): string {
  return (explicit ?? ENV_WHATSAPP).replace(/\D/g, "");
}

/** Click-to-chat link with a prefilled message. Returns "" when no number is configured. */
export function getWhatsAppLink(message: string, explicitNumber?: string): string {
  const number = getWhatsAppNumber(explicitNumber);
  if (!number) return "";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Product enquiry message including product name and selected pack size. */
export function productEnquiryMessage(productName: string, packSize?: string): string {
  const pack = packSize ? ` (${packSize})` : "";
  return `Hello MJ Nature Natural, I would like to enquire about ${productName}${pack}.`;
}

/** Bulk / festive gifting hamper enquiry message. */
export function hamperEnquiryMessage(): string {
  return "Hi, I'd like to enquire about gift hampers.";
}
