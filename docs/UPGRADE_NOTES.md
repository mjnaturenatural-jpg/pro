# Redesign v2 — Audit & Upgrade Notes

## Stack audit (2026-10-14)
- **Framework:** Next.js 14.2.35, App Router, React 18.3.1, TypeScript 5.6.
- **Styling:** Tailwind CSS 3.4 (custom palette in `tailwind.config.ts`), component classes in `src/app/globals.css`. No CSS modules, no UI kit.
- **Fonts:** `next/font/google` — Fraunces (serif) + Plus Jakarta Sans (body). v2 switches body to DM Sans.
- **State:** zustand 5 + persist (`mj-cart`) in `src/store/cart.ts`. Toast via `ToastProvider`.
- **Data:** MongoDB Atlas (mongoose 8) via `src/lib/db.ts` (custom DNS workaround, do not touch). Models: Product, Category, HomepageContent, SiteSettings, Order, User, Coupon, Review(?). Queries in `src/lib/queries.ts`.
- **Images:** `next/image` + local `public/images/**`; AVIF/WebP enabled; Cloudinary configured but cloud name unverified (admin uploads blocked until client confirms).
- **Payments:** Razorpay (key/secret empty in env — test/placeholder). Checkout JSON-LD theme color only.
- **Auth/Admin:** next-auth credentials; admin under `src/app/admin/**`; APIs under `src/app/api/**`. **Do not alter logic.**
- **SEO:** native metadata API only. No sitemap/robots yet. `APP_URL` defaulted to localhost (fixed in v2 via `SITE_URL`).

## v2 architecture additions
- `/config/site.ts` — single business-config file (placeholders clearly marked `TODO(client)`).
- `/components/ui/*` — primitives (Button, Badge, Card, SectionHeader, Container, Rating, QuantityStepper, Skeleton, Accordion, Drawer, Modal, Tabs, Breadcrumbs). Toast stays as-is.
- `/lib/motion.ts` + `Reveal` — framer-motion variants, reduced-motion safe.
- `/lib/analytics.ts` — no-op-safe event wrapper (GA4/Meta Pixel IDs optional).
- `/lib/whatsapp.ts` — `getWhatsAppLink(message)` helper.
- `/lib/format.ts` — `formatPrice()` whole-rupee rounding.
- `/data/reviews.ts` — editable reviews + aggregate summary.
- `sitemap.ts` / `robots.ts` routes; `opengraph-image` static `public/og.jpg` (1200×630, generated via sharp script).
- Embla for reviews carousel (dynamic import); search overlay (dynamic import).

## Decisions / deviations
- Badge key `noAddedSugar` kept (data model); user-facing label → "No Refined Sugar".
- Free-shipping threshold reuses existing `FREE_SHIPPING_THRESHOLD` (999) unless config overrides; exposed in site config with TODO.
- Announcement bar: rotating messages from config; free-shipping message uses config threshold (placeholder until client confirms).
- Reviews shown are the owner-collected testimonials already in DB; "Verified buyer" badge + aggregate computed from `/data/reviews.ts` copy of the same data.
- No fake lab reports, no invented FSSAI/phone/email — placeholders render admin-editable fallbacks and are listed in `ASSETS AND INFO NEEDED FROM CLIENT` (CHANGELOG).

## Contrast (WCAG AA) — spot-checked pairs (dark text on light / light text on dark)
- caramel-700 #7E4A17 on cream #FDFAF5 ≈ 7.5 ✓ / white on caramel-700 ≈ 7.5 ✓ (primary buttons, eyebrows)
- brown-900 #3B2314 on cream ≈ 12 ✓ / cream on brown-900 ≈ 12 ✓ (footer, spotlight)
- turmeric-300 #F2C95C on brown-900 ≈ 8 ✓ (footer headings, spotlight accents)
- white on leaf-600 #4F6B3A ≈ 5.9 ✓ / leaf-700 #43602F on cream ≈ 7.5 ✓ (success, badges)
- white on chilli-600 #B23A2B ≈ 6.5 ✓ (sale badges, cart badge)
- muted #6B5848 on cream ≈ 5.9 ✓ (secondary text)
- Mid-tone accents (caramel-500/600, turmeric-400/500, honey) are used only for large graphics, icons and bold 14px+ labels on light grounds, never for small body text.
