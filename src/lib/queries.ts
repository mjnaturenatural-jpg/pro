import { connectDB } from "@/lib/db";
import { Category, HomepageContent, Product, SiteSettings } from "@/models";

export async function getSettings() {
  await connectDB();
  const s = await SiteSettings.findOne({ key: "site" }).lean();
  return (
    (s as unknown as Record<string, unknown>) ?? {
      brandName: "MJ Nature Naturals",
      logo: "",
      favicon: "",
      contactEmail: "",
      phone: "",
      whatsapp: "",
      address: "",
      instagram: "",
      facebook: "",
      youtube: "",
      announcementText: "",
      announcementEnabled: false,
      freeShippingThreshold: 999,
      flatShipping: 79,
      taxRate: 0,
      gstNumber: "",
    }
  );
}

export async function getHomepageContent() {
  await connectDB();
  const c = await HomepageContent.findOne({ key: "homepage" }).lean();
  return c as unknown as Record<string, unknown> | null;
}

export async function getPublishedCategories() {
  await connectDB();
  const cats = await Category.find({ published: true }).sort({ order: 1, name: 1 }).lean();
  return cats as unknown as {
    _id: string;
    name: string;
    slug: string;
    description: string;
    image: string;
  }[];
}

export type ProductCardData = {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  images: string[];
  category: { _id: string; name: string; slug: string } | string;
  packSizes: { label: string; mrp: number; price: number; stock: number; sku?: string }[];
  badges: { pureGhee: boolean; noMaida: boolean; noAddedSugar: boolean };
  featured: boolean;
  published: boolean;
  averageRating: number;
  reviewCount: number;
  totalSold: number;
  createdAt: string;
};

export function serializeProduct(p: unknown): ProductCardData {
  const prod = JSON.parse(JSON.stringify(p));
  return prod;
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  await connectDB();
  const products = await Product.find({ published: true })
    .populate("category", "name slug")
    .sort({ featured: -1, totalSold: -1, createdAt: -1 })
    .limit(limit)
    .lean();
  return products.map(serializeProduct);
}

export async function getProductsBySlugs(slugs: string[]): Promise<ProductCardData[]> {
  if (!slugs.length) return [];
  await connectDB();
  const products = await Product.find({ slug: { $in: slugs }, published: true })
    .populate("category", "name slug")
    .lean();
  const map = new Map(products.map((p) => [(p as { slug: string }).slug, serializeProduct(p)]));
  return slugs.map((s) => map.get(s)).filter(Boolean) as ProductCardData[];
}
