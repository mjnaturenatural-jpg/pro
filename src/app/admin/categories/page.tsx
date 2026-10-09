import { guardAdmin } from "@/lib/admin-guard";
import { connectDB } from "@/lib/db";
import { Category, Product } from "@/models";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await guardAdmin("/admin/categories");
  await connectDB();
  const [categories, counts] = await Promise.all([
    Category.find().sort({ order: 1, name: 1 }).lean(),
    Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

  return (
    <CategoryManager
      categories={JSON.parse(JSON.stringify(categories)).map(
        (c: { _id: string } & Record<string, unknown>) => ({
          ...c,
          productCount: countMap.get(c._id) || 0,
        })
      )}
    />
  );
}
