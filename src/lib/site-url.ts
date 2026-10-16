const CANONICAL_SITE_URL = "https://www.mjnaturenatural.com";

/**
 * Resolve a public site origin from env-provided URL candidates.
 * Production builds must never advertise a developer's localhost server in
 * canonical links, sitemaps, OG tags or JSON-LD, so localhost / plain-http
 * values are discarded in production and the canonical domain is used instead.
 * In development localhost stays valid so local previews work.
 */
export function resolveSiteUrl(...candidates: (string | undefined | null)[]): string {
  const isProduction = process.env.NODE_ENV === "production";
  for (const raw of candidates) {
    const value = (raw || "").trim();
    if (!value) continue;
    if (!isProduction) return value.replace(/\/+$/, "");
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      continue;
    }
    const host = url.hostname.toLowerCase();
    const isLocal =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local");
    if (isLocal) continue;
    if (url.protocol !== "http:" && url.protocol !== "https:") continue;
    url.protocol = "https:";
    return url.toString().replace(/\/+$/, "");
  }
  return CANONICAL_SITE_URL;
}
