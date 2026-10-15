# Redesign v2 — Changelog

Branch: `redesign-v2`. No cart, checkout, payment, order, webhook, auth or admin logic was altered — only presentation, copy, metadata and additive read-only helpers/APIs.

## Phase 0 — Audit & safety
- Audited stack (Next.js 14 App Router, Tailwind, zustand cart, Mongoose, Razorpay, next-auth) → `docs/UPGRADE_NOTES.md`.
- Installed only `framer-motion` + `embla-carousel-react` (`clsx`, `tailwind-merge`, `lucide-react`, `sharp` already present).

## Phase 1 — Trust & correctness fixes
- `SITE_URL` constant (`NEXT_PUBLIC_SITE_URL`, production default); all canonical/OG/sitemap URLs use it — zero `localhost` references in output.
- Generated `public/og.jpg` (1200×630, logo + tagline + claims) via `scripts/make-og.mjs`; per-page metadata for home/product, OG fallback everywhere.
- Removed the placeholder WhatsApp number from env; `getWhatsAppLink()` helper everywhere; product WhatsApp enquiries prefill name + pack; hamper enquiry message for gifting.
- New `config/site.ts`: brand, tagline, phone/email/address/hours, FSSAI, GSTIN, socials, shipping thresholds, COD flag, newsletter offer, pincode ETA rules — every unknown marked `TODO(client)`.
- Footer + checkout render a text-based FSSAI badge only when a licence number exists; removed “Business registration details are being updated”.
- “No Added Sugar” → “No Refined Sugar” in all user-facing copy (code + DB); badge data-key `noAddedSugar` preserved.
- `formatPrice()` whole-rupee display adopted across storefront, cart, checkout and order-success; cards show “from ₹X / pack”, MRP strikethrough and a small discount badge (hidden when MRP == price).

## Phase 2 — Design system
- New warm premium tokens (cream, sand, jaggery-brown, caramel, turmeric, leaf, chilli, muted ink) with AA-checked pairs; brown-tinted shadows; DM Sans body + Fraunces display.
- Paper-grain overlay, wave dividers, leaf/jaggery motifs; global focus rings; reduced-motion support.
- UI primitives: Button, Badge (+Eyebrow), Card, Container, SectionHeader, Rating, QuantityStepper, Skeleton, Accordion, Drawer, Modal, Tabs, Breadcrumbs. Motion variants + `Reveal` wrapper.

## Phase 3 — Global layout
- Rotating announcement bar (4s, pause-on-hover, per-session dismiss, aria-live).
- Sticky header that solidifies/shrinks on scroll; mega-menu with all 8 categories (thumbnail + description + Shop-all); search overlay; animated cart badge opening a cart drawer; mobile accordion drawer.
- Rebuilt dark footer: brand + socials + newsletter mini-form (honeypot + validation), Navigation, Customer Care (+policies), Reach Us (phone/email/address/hours), FSSAI/GSTIN only when present, trust chips, payment chips, copyright.
- Floating WhatsApp (8s pulse + tooltip, clears the mobile sticky bar) + scroll-aware back-to-top.

## Phase 4 — Home page
- Hero: arch image mask, floating product cut-outs, floating badges, trust chips, initials-avatar social proof with live aggregate rating.
- Trust marquee (pausable), category tiles with live item counts (snap-scroll mobile), tabbed Bestsellers (All/Chikki/Cookies/Brownies/Laddus), story with count-up stats + signature, drawing timeline, dark spotlight with price + gold CTA, gifting band with prefilled WhatsApp CTA, Why-Us grid.
- Reviews: Embla carousel + aggregate summary + distribution bars + verified-buyer badges, driven by editable `data/reviews.ts`; Instagram grid (shows when URL configured).
- Newsletter (₹50-off incentive from config) + FAQ accordion with FAQPage JSON-LD.

## Phase 5 — Shop / product / cart / checkout / pages
- Shop: breadcrumbs, category banner, dietary tags (Millet/Pure Ghee/Eggless/Gifting via additive API param), price slider, active-filter chips, result count, skeleton, empty state, pagination, mobile bottom-sheet filters.
- Product: breadcrumbs, lightbox zoom, hover-crossfade cards, ratings, variant pills, stepper, Add/Buy + WhatsApp enquiry, pincode ETA checker, trust strip, animated accordions, Frequently-Bought-Together with add-selected, You-May-Also-Like, review nudge, sticky mobile buy bar, BreadcrumbList JSON-LD.
- Cart: free-shipping progress bar + trust row. Cart drawer (from header): line items, steppers, progress, upsells, subtotal, checkout CTA.
- Checkout: progress steps, trust badges, COD-aware messaging, FSSAI line (payment logic untouched).
- About rewritten (story, kitchen gallery, conditional founder, values, process timeline, FSSAI mention); Contact (config fallbacks, hours, map placeholder/embed); policy pages share PolicyLayout with auto sticky TOC + last-updated; branded 404 + error pages with product suggestions.

## Phase 6 — SEO / a11y / analytics / QA
- Sitemap (products + categories + static), robots (admin/api disallowed), Organization + WebSite/SearchAction + Product + BreadcrumbList + FAQPage JSON-LD, skip-to-content link, keyboard-accessible menus/dialogs/carousel, 44px targets.
- `lib/analytics.ts` no-op-safe wrapper; events: view_item, add_to_cart, begin_checkout, whatsapp_click, newsletter_signup.
- Verified: lint + typecheck + production build clean; all routes 200 with zero server errors; greps confirm no `localhost`, no placeholder number, no user-facing “No Added Sugar”, no “MJ Nature Naturals”, no visible unrounded prices.

## ASSETS AND INFO NEEDED FROM CLIENT
- Hero photo (min 2400px wide) + lifestyle shots; founder photo + founder name/story text.
- Real phone + WhatsApp number (international format, no `+`), official email, full street address, support hours.
- FSSAI licence number, GSTIN.
- Instagram / Facebook / YouTube profile URLs; permission to show real customer reviews (names, cities, product bought).
- Free-shipping threshold + flat rate confirmation; courier ETAs per zone; COD yes/no; newsletter discount rule (currently shows “₹50 off first order” as placeholder).
- Cloudinary cloud name (exact dashboard value — admin uploads blocked until then); Razorpay live keys when ready to accept payments.
- Shiprocket: warehouse **pickup pincode** (enables live checkout rates) + pickup location **nickname** exactly as saved in the Shiprocket dashboard (enables admin shipment creation). Email is configured; keep the password in the server env only.
