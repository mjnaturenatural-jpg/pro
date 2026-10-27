import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { Product, Category } from "@/models";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { ProductCard, type ProductCardData } from "@/components/product/ProductCard";
import { FrequentlyBought } from "@/components/product/FrequentlyBought";
import { breadcrumbJsonLd } from "@/components/ui/Breadcrumbs";
import { getSettings } from "@/lib/queries";
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

async function getRelated(productId: string, categoryId: string): Promise<ProductCardData[]> {
  await connectDB();
  const base = { _id: { $ne: productId }, published: true };
  let related =
    categoryId !== ""
      ? await Product.find({ ...base, category: categoryId }).limit(4).lean()
      : [];
  if (related.length < 4) {
    const exclude = [productId, ...related.map((r: { _id: unknown }) => r._id)];
    const more = await Product.find({ _id: { $nin: exclude }, published: true })
      .limit(4 - related.length)
      .lean();
    related = [...related, ...more];
  }
  return JSON.parse(JSON.stringify(related));
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
  badges: { pureGhee: boolean; eggless: boolean; noMaida: boolean; noAddedSugar: boolean };
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
      url: `${APP_URL}/product/${product.slug}`,
      images: product.images[0]
        ? [{ url: product.images[0] }]
        : [{ url: `${APP_URL}/og.jpg`, width: 1200, height: 630 }],
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const categoryName = typeof product.category === "string" ? "" : product.category?.name || "";
  const categoryId =
    product.category && typeof product.category === "object"
      ? String((product.category as unknown as { _id: string })._id || "")
      : "";
  const related = await getRelated(String(product._id), categoryId);
  const settings = await getSettings();
  const whatsapp = (settings.whatsapp as string) || "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription || product.description || "",
    image: product.images.slice(0, 2),
    brand: { "@type": "Brand", name: "MJ Nature Natural" },
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

  const breadcrumbLd = breadcrumbJsonLd(
    [
      { label: "Home", href: "/" },
      { label: "Shop", href: "/shop" },
      ...(categoryName ? [{ label: categoryName }] : []),
      { label: product.name },
    ],
    APP_URL
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="container-site py-8 sm:py-12">
        <ProductDetailView product={JSON.parse(JSON.stringify(product))} categoryName={categoryName} whatsapp={whatsapp} />
        <FrequentlyBought products={related.slice(0, 2)} />
      </div>
      {related.length > 0 && (
        <section className="container-site pb-16 sm:pb-20">
          <div className="mb-8 text-center">
            <p className="eyebrow mb-2">Pairs well with</p>
            <h2 className="section-title">You May Also Like</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
