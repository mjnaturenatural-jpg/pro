import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { Product, Category } from "@/models";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { APP_URL } from "@/lib/constants";
export const revalidate = 60;

interface Props {
  params: { slug: string };
}

async function getProduct(slug: string) {
  await connectDB();
  const product = await Product.findOne({ slug, published: true })
    .populate("category", "name slug")
    .lean();
  return product as unknown as ProductData | null;
}

interface ProductData {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  ingredients: string;
  allergenInfo: string;
  storageInstructions: string;
  howToUse: string;
  shippingInfo: string;
  returnInfo: string;
  images: string[];
  packSizes: { label: string; mrp: number; price: number; stock: number; sku: string }[];
  badges: { pureGhee: boolean; noMaida: boolean; noAddedSugar: boolean };
  averageRating: number;
  reviewCount: number;
  category: { name: string; slug: string } | string;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.shortDescription || product.description?.slice(0, 160) || "",
    alternates: { canonical: `${APP_URL}/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription || "",
      images: product.images[0] ? [{ url: product.images[0] }] : [],
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const categoryName = typeof product.category === "string" ? "" : product.category?.name || "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description || "",
    image: product.images,
    brand: { "@type": "Brand", name: "MJ Nature Naturals" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: Math.min(...product.packSizes.map((p) => p.price)),
      highPrice: Math.max(...product.packSizes.map((p) => p.price)),
      availability: product.packSizes.some((p) => p.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.averageRating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container-site py-8 sm:py-12">
        <ProductDetailView product={JSON.parse(JSON.stringify(product))} categoryName={categoryName} />
      </div>
    </>
  );
}
