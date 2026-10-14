/**
 * Single source of truth for business details.
 * Every value marked TODO(client) is a placeholder the client must confirm.
 * Nothing here is shown as "verified" unless the client supplied it.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.mjnaturenatural.com";

export const siteConfig = {
  brandName: "MJ Nature Natural",
  tagline: "Homemade Goodness, Delivered to Your Door.",

  phone: "+91 94934 35877",
  phoneHref: "919493435877",
  // TODO(client): official support email.
  email: "",
  // TODO(client): full street address with city, state and pincode.
  address: "",
  // TODO(client): support hours, e.g. "Mon–Sat, 9am–6pm IST".
  hours: "",

  // TODO(client): founder name + portrait photo path for the About page.
  founderName: "",
  founderPhoto: "/founder.png",

  // TODO(client): Google Maps embed URL for the Contact page (iframe src).
  mapEmbedUrl: "",

  fssai: "23626320000132",
  // TODO(client): GSTIN — shown in footer once supplied.
  gstin: "",

  // TODO(client): social + review profile URLs.
  instagram: "",
  facebook: "",
  youtube: "",
  googleReviews: "",

  // TODO(client): confirm free-shipping threshold and flat rate.
  freeShippingThreshold: 999,
  flatShipping: 79,

  // TODO(client): is Cash on Delivery offered?
  codAvailable: false,

  // TODO(client): confirm first-order newsletter incentive rule.
  newsletterOffer: "Get ₹50 off your first order",

  supportPromises: [
    "100% Eggless, always",
    "No Maida, no refined sugar",
    "Small-batch home kitchen",
    "Ships across India",
  ] as string[],

  // Pincode delivery estimate rules (prefix -> working days range).
  // TODO(client): confirm dispatch city and courier ETAs.
  pincodeEta: [
    { prefixes: ["500", "501", "502", "503", "504", "505", "506", "507", "508", "509"], label: "2–3 working days" },
    { prefixes: ["110", "400", "411", "560", "600", "700"], label: "3–4 working days" },
  ] as { prefixes: string[]; label: string }[],
  pincodeEtaDefault: "4–6 working days",
};

export type SiteConfig = typeof siteConfig;
