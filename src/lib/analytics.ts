/**
 * No-op-safe analytics wrapper. Events fire only when GA4 / Meta Pixel
 * scripts are present (NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_META_PIXEL_ID).
 */
type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params: EventParams = {}): void {
  try {
    if (typeof window === "undefined") return;
    if (typeof window.gtag === "function") window.gtag("event", name, params);
    if (typeof window.fbq === "function") window.fbq("trackCustom", name, params);
  } catch {
    // analytics must never break the shopping flow
  }
}

export const analytics = {
  viewItem: (id: string, name: string, price: number) =>
    trackEvent("view_item", { item_id: id, item_name: name, price }),
  addToCart: (id: string, name: string, price: number, quantity = 1) =>
    trackEvent("add_to_cart", { item_id: id, item_name: name, price, quantity }),
  beginCheckout: (value: number, count: number) =>
    trackEvent("begin_checkout", { value, item_count: count }),
  whatsappClick: (source: string) => trackEvent("whatsapp_click", { source }),
  newsletterSignup: () => trackEvent("newsletter_signup", {}),
};
