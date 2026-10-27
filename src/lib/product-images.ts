import catalog from "@/lib/product-image-catalog.json";

export type ProductImageMeta = { width: number; height: number };

const images = catalog.images as Record<string, ProductImageMeta>;
const galleries = catalog.galleries as Record<string, string[]>;

export const PRODUCT_CARD_SIZES =
  "(max-width: 639px) 46vw, (max-width: 1024px) 31vw, (max-width: 1280px) 23vw, 280px";

export const PRODUCT_DETAIL_SIZES = "(max-width: 1024px) 92vw, 560px";

export function normalizeImageSrc(src: string): string {
  const trimmed = src.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.pathname.startsWith("/images/")) return url.pathname;
    } catch {
      return trimmed;
    }
    return trimmed;
  }
  return trimmed.split("?")[0];
}

export function imageMeta(src: string): ProductImageMeta | undefined {
  return images[normalizeImageSrc(src)];
}

export function isRemoteImage(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

export function isKnownLocalImage(src: string): boolean {
  return Boolean(images[normalizeImageSrc(src)]);
}

export function galleryForSlug(slug?: string): string[] {
  if (!slug || !galleries[slug]) return [];
  return galleries[slug];
}

export function slugFromImageSrc(src: string): string | undefined {
  const normalized = normalizeImageSrc(src);
  const match = normalized.match(/\/images\/products\/(.+?)(?:-\d+)?\.(?:webp|jpe?g|png)$/i);
  if (!match) return undefined;
  return galleries[match[1]] ? match[1] : undefined;
}

export function resolveProductImages(input: string[] | undefined, slug?: string): string[] {
  const list = (input || []).map((src) => src.trim()).filter(Boolean);
  const remote = list.filter(isRemoteImage);
  if (remote.length) return remote;
  const known = list.map(normalizeImageSrc).filter(isKnownLocalImage);
  if (known.length) return known;
  const otherLocal = list.filter(
    (src) => src.startsWith("/") && !src.startsWith("/images/products/")
  );
  if (otherLocal.length) return otherLocal;
  const gallery = galleryForSlug(slug);
  if (gallery.length) return gallery.slice(0, 2);
  return list.filter((src) => src.startsWith("/"));
}

export function resolveProductImage(src: string, slug?: string): string {
  return resolveProductImages(src ? [src] : [], slug)[0] || "";
}

export function productImageSrcSet(src: string): string | undefined {
  const meta = imageMeta(src);
  if (!meta) return undefined;
  const normalized = normalizeImageSrc(src);
  return `${normalized} ${meta.width}w`;
}

export function productImageCandidates(src: string, slug?: string): string[] {
  const primary = resolveProductImage(src, slug);
  const extras = galleryForSlug(slug);
  return Array.from(new Set([primary, ...extras].filter(Boolean)));
}
