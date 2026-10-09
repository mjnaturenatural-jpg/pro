export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "MJ Nature Naturals";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const CATEGORIES = [
  { name: "Laddus", slug: "laddus" },
  { name: "Brownies", slug: "brownies" },
  { name: "Cookies", slug: "cookies" },
  { name: "Millet Cookies", slug: "millet-cookies" },
  { name: "Jaggery Products", slug: "jaggery-products" },
  { name: "Chikki", slug: "chikki" },
  { name: "Mixtures", slug: "mixtures" },
  { name: "Pantry Staples", slug: "pantry-staples" },
] as const;

export const BADGES = [
  { key: "pureGhee", label: "100% Pure Ghee" },
  { key: "noMaida", label: "No Maida" },
  { key: "noAddedSugar", label: "No Added Sugar" },
] as const;

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

// Placeholder — replace with the real business WhatsApp number (international format, no +)
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919876543210";
export const WHATSAPP_MESSAGE =
  "Hi! I'd like to know more about your products.";

export const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan",
  "Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
] as const;
