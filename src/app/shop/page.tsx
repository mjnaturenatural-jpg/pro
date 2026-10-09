import { Suspense } from "react";
import { ShopPageClient } from "@/components/shop/ShopPageClient";
import { getPublishedCategories } from "@/lib/queries";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop",
  description:
    "Explore the full MJ Nature Naturals collection — laddus, brownies, cookies and millet treats crafted with care.",
};

export default async function ShopPage() {
  const categories = await getPublishedCategories();
  return (
    <div className="container-site py-10 sm:py-14">
      <div className="mb-8">
        <p className="eyebrow mb-2">Shop</p>
        <h1 className="section-title">Explore our collection</h1>
        <p className="mt-2 text-sm text-bark-500">
          Thoughtfully crafted natural foods, packed fresh and delivered to your door.
        </p>
      </div>
      <Suspense>
        <ShopPageClient categories={categories} />
      </Suspense>
    </div>
  );
}
