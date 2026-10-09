import { guardAdmin } from "@/lib/admin-guard";
import { connectDB } from "@/lib/db";
import { Product, Category } from "@/models";
import { InventoryManager } from "@/components/admin/InventoryManager";

export const metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";

export default async function AdminInventoryPage({ searchParams }: { searchParams: { category?: string } }) {
  await guardAdmin("/admin/inventory");
  await connectDB();

  const [categories, products] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Product.find()
      .populate("category", "name slug")
      .sort({ name: 1 })
      .select("name slug images packSizes category published")
      .lean(),
  ]);

  return (
    <InventoryManager
      categories={JSON.parse(JSON.stringify(categories))}
      products={JSON.parse(JSON.stringify(products))}
    />
  );
}
