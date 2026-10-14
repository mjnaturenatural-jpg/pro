export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "MJ Nature Natural";
export const APP_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://www.mjnaturenatural.com";

export const CATEGORIES = [
  { name: "Chikki", slug: "chikki" },
  { name: "Cookies", slug: "cookies" },
  { name: "Brownie", slug: "brownies" },
  { name: "Raw Materials", slug: "raw-materials" },
  { name: "Laddus", slug: "laddus" },
  { name: "Millet Cookies", slug: "millet-cookies" },
  { name: "Jaggery Products", slug: "jaggery-products" },
  { name: "Mixtures", slug: "mixtures" },
] as const;

export const BADGES = [
  { key: "pureGhee", label: "100% Pure Ghee" },
  { key: "eggless", label: "100% Eggless" },
  { key: "noMaida", label: "No Maida" },
  { key: "noAddedSugar", label: "No Refined Sugar" },
] as const;

export const BADGE_STYLES: Record<string, string> = {
  pureGhee: "bg-honey-100 text-honey-700",
  eggless: "bg-leaf-100 text-leaf-700",
  noMaida: "bg-caramel-100 text-caramel-700",
  noAddedSugar: "bg-berry-100 text-berry-700",
};

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "best_selling", label: "Best Selling" },
] as const;

export const FREE_SHIPPING_THRESHOLD = 999;
export const FLAT_SHIPPING = 79;

// Verified business WhatsApp number (international format, no +). Configure via
// Site Settings → WhatsApp in the admin, or the NEXT_PUBLIC_WHATSAPP_NUMBER env var.
// When empty the WhatsApp actions are hidden entirely — never invent a number.
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
export { DEFAULT_WHATSAPP_MESSAGE as WHATSAPP_MESSAGE } from "./whatsapp";

export const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
] as const;
