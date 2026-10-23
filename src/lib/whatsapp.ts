// Verified business WhatsApp number (international format, no +).
export const VERIFIED_WHATSAPP_NUMBER = "919493435877";

export const DEFAULT_WHATSAPP_MESSAGE =
  "Hello MJ Nature Natural, I would like to know more about your products.";

/**
 * Digits-only WhatsApp number.
 *
 * An admin override from Site Settings wins when present; otherwise the site
 * always falls back to the verified business number above.
 */
export function getWhatsAppNumber(explicit?: string): string {
  const configured = (explicit ?? "").replace(/\D/g, "");
  return configured || VERIFIED_WHATSAPP_NUMBER;
}

/** Click-to-chat link with a prefilled message. */
export function getWhatsAppLink(message: string, explicitNumber?: string): string {
  return `https://wa.me/${getWhatsAppNumber(explicitNumber)}?text=${encodeURIComponent(message)}`;
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
