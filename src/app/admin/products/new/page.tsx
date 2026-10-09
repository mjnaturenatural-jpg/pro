import { guardAdmin } from "@/lib/admin-guard";
import { connectDB } from "@/lib/db";
import { Category, Product } from "@/models";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const metadata = { title: "New Product" };
export const dynamic = "force-dynamic";

export default async function AdminNewProductPage() {
  await guardAdmin("/admin/products/new");
  await connectDB();
  const categories = await Category.find().sort({ name: 1 }).lean();

  return <ProductEditor categories={JSON.parse(JSON.stringify(categories))} product={null} />;
}
