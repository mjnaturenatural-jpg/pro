import { Suspense } from "react";
import { ShopPageClient } from "@/components/shop/ShopPageClient";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getCategoryCounts, getPublishedCategories } from "@/lib/queries";
import { connectDB } from "@/lib/db";
import { Category } from "@/models";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop",
  description:
    "Explore the full MJ Nature Natural collection — 100% eggless laddus, brownies, cookies and millet treats made with pure ghee, real butter and original jaggery — no maida, no refined sugar.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const [categories, counts] = await Promise.all([getPublishedCategories(), getCategoryCounts()]);
  let active: { name: string } | null = null;
  if (searchParams.category) {
    try {
      await connectDB();
      const cat = (await Category.findOne({ slug: searchParams.category, published: true }).lean()) as unknown as {
        name: string;
      } | null;
      if (cat) active = { name: cat.name };
    } catch {
      active = null;
    }
  }

  return (
    <div className="container-site py-10 sm:py-14">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: active ? active.name : "Shop" }]}
      />
      {!searchParams.category && (
        <div className="mb-8">
          <p className="eyebrow mb-2">Shop</p>
          <h1 className="section-title">Explore our collection</h1>
          <p className="mt-2 text-sm text-bark-500">
            Thoughtfully crafted natural foods, packed fresh and delivered to your door.
          </p>
        </div>
      )}
      <Suspense>
        <ShopPageClient categories={categories.map((category) => ({ ...category, productCount: counts[category.slug] || 0 }))} />
      </Suspense>
    </div>
  );
}
