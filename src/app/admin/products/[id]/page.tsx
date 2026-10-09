import { guardAdmin } from "@/lib/admin-guard";
import { connectDB } from "@/lib/db";
import { Category, Product } from "@/models";
import { ProductEditor } from "@/components/admin/ProductEditor";

export const metadata = { title: "Product Editor" };
export const dynamic = "force-dynamic";

export default async function AdminProductEditPage({ params }: { params: { id: string } }) {
  await guardAdmin(`/admin/products/${params.id}`);
  await connectDB();

  const isNew = params.id === "new";
  const [categories, product] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    isNew ? Promise.resolve(null) : Product.findById(params.id).populate("category", "name slug").lean(),
  ]);

  if (!isNew && !product) {
    return <p className="py-12 text-center text-bark-500">Product not found.</p>;
  }

  return (
    <ProductEditor
      categories={JSON.parse(JSON.stringify(categories))}
      product={product ? JSON.parse(JSON.stringify(product)) : null}
    />
  );
}
