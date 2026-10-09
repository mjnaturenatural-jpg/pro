import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Product, Category } from "@/models";
import { APP_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/shop",
    "/about",
    "/contact",
    "/cart",
    "/privacy-policy",
    "/terms",
    "/shipping-policy",
    "/refund-policy",
  ].map((path) => ({
    url: `${APP_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    await connectDB();
    const [products, categories] = await Promise.all([
      Product.find({ published: true }).select("slug updatedAt").lean(),
      Category.find({ published: true }).select("slug").lean(),
    ]);
    const productRoutes = products.map((p) => ({
      url: `${APP_URL}/product/${(p as { slug: string }).slug}`,
      lastModified: (p as { updatedAt?: Date }).updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
    const categoryRoutes = categories.map((c) => ({
      url: `${APP_URL}/shop?category=${(c as { slug: string }).slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
    return [...staticRoutes, ...productRoutes, ...categoryRoutes];
  } catch {
    return staticRoutes;
  }
}
