import { Suspense } from "react";
import Image from "next/image";
import { ShopPageClient } from "@/components/shop/ShopPageClient";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getPublishedCategories } from "@/lib/queries";
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
  const categories = await getPublishedCategories();
  let active: { name: string; description: string; image: string } | null = null;
  if (searchParams.category) {
    try {
      await connectDB();
      const cat = (await Category.findOne({ slug: searchParams.category }).lean()) as unknown as {
        name: string;
        description: string;
        image: string;
      } | null;
      if (cat) active = { name: cat.name, description: cat.description || "", image: cat.image || "" };
    } catch {
      active = null;
    }
  }

  return (
    <div className="container-site py-10 sm:py-14">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: active ? active.name : "Shop" }]}
      />
      {active?.image ? (
        <div className="relative mb-8 overflow-hidden rounded-[28px] shadow-soft">
          <div className="relative h-44 sm:h-56">
            <Image
              src={active.image}
              alt={active.name}
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brown-900/80 via-brown-900/45 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-turmeric-300">
                Shop · {active.name}
              </p>
              <h1 className="mt-1 font-serif text-3xl font-bold text-white sm:text-4xl">
                {active.name}
              </h1>
              {active.description && (
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/85">
                  {active.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <p className="eyebrow mb-2">Shop</p>
          <h1 className="section-title">Explore our collection</h1>
          <p className="mt-2 text-sm text-bark-500">
            Thoughtfully crafted natural foods, packed fresh and delivered to your door.
          </p>
        </div>
      )}
      <Suspense>
        <ShopPageClient categories={categories} />
      </Suspense>
    </div>
  );
}
