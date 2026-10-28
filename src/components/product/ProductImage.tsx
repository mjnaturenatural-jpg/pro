"use client";

import Image, { type ImageLoader } from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  imageMeta,
  isRemoteImage,
  productImageCandidates,
  productImageSrcSet,
  slugFromImageSrc,
} from "@/lib/product-images";

const QUALITY = 92;

const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  const q = quality ?? QUALITY;
  const marker = "/upload/";
  const at = src.indexOf(marker);
  if (at < 0) return src;
  const head = src.slice(0, at);
  const rest = src.slice(at + marker.length);
  const parts = rest.split("/");
  const versionAt = parts.findIndex((part) => /^v\d+$/.test(part));
  const hasTransform = /,/.test(parts[0] || "") || /^(?:c_|w_|h_|q_|f_|g_|e_|dpr_|fl_)/.test(parts[0] || "");
  const tail = versionAt >= 0 ? parts.slice(versionAt).join("/") : hasTransform ? parts.slice(1).join("/") : rest;
  return `${head}${marker}c_limit,w_${width},q_${q},f_auto/${tail}`;
};

export function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  slug,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  slug?: string;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const resolvedSlug = slug || slugFromImageSrc(src);
  const candidates = productImageCandidates(src, resolvedSlug);
  const current = candidates[index] || "";

  useEffect(() => {
    setIndex(0);
  }, [src, slug]);

  if (!current) {
    return <span className="absolute inset-0 bg-white" aria-hidden="true" />;
  }

  let local = current.startsWith("/") && (meta || current.startsWith("/images/products/"));
  if (current.startsWith("/images/products/") && !meta) {
    local = true;
  }

  return (
    <span className={cn("absolute inset-0 flex items-center justify-center p-1.5 sm:p-2.5", className)}>
      {local ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current}
          srcSet={meta ? productImageSrcSet(current) : undefined}
          sizes={sizes}
          alt={alt}
          width={meta?.width}
          height={meta?.height}
          style={meta ? { aspectRatio: `${meta.width} / ${meta.height}` } : undefined}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onError={() => setIndex((i) => i + 1)}
          draggable={false}
          className="product-photo h-full w-full object-contain object-center"
        />
      ) : (
        <Image
          src={current}
          alt={alt}
          fill
          sizes={sizes}
          quality={QUALITY}
          priority={priority}
          loader={isRemoteImage(current) && current.includes("res.cloudinary.com") ? cloudinaryLoader : undefined}
          onError={() => setIndex((i) => i + 1)}
          className="object-contain object-center h-full w-full"
        />
      )}
    </span>
  );
}
