import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { guardAdmin } from "@/lib/admin-guard";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { ProductRowActions } from "@/components/admin/ProductRowActions";

export const metadata = { title: "Products" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  await guardAdmin("/admin/products");
  await connectDB();

  const q = searchParams.q || "";
  const page = Math.max(1, Number(searchParams.page || 1));
  const limit = 20;
  const filter = q
    ? { name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
    : {};

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-bark-900">Products</h1>
          <p className="text-sm text-bark-500">{total} products</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary btn-sm">
          <Plus size={15} /> New Product
        </Link>
      </div>

      <form className="flex max-w-md items-center gap-2 rounded-lg border border-bark-800/10 bg-ivory-100 px-3 py-2">
        <Search size={15} className="text-bark-400" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products…"
          className="w-full bg-transparent text-sm focus:outline-none"
        />
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ivory-100 text-left text-[11px] uppercase tracking-wide text-bark-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bark-800/5">
              {products.map((raw) => {
                const p = raw as unknown as {
                  _id: string;
                  name: string;
                  slug: string;
                  images: string[];
                  packSizes: { label: string; price: number; mrp: number; stock: number }[];
                  category: { name: string } | null;
                  featured: boolean;
                  published: boolean;
                };
                const totalStock = p.packSizes.reduce((s, ps) => s + ps.stock, 0);
                const minPrice = Math.min(...p.packSizes.map((ps) => ps.price));
                return (
                  <tr key={p._id} className="hover:bg-ivory-50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${p._id}`} className="font-medium text-bark-900 hover:text-caramel-600">
                        {p.name}
                      </Link>
                      <p className="text-[11px] text-bark-400">{p.packSizes.length} pack sizes</p>
                    </td>
                    <td className="px-4 py-3 text-bark-600">
                      {(p.category as { name?: string })?.name || "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">₹{minPrice}</td>
                    <td className="px-4 py-3">
                      <span className={totalStock <= 5 ? "font-semibold text-amber-600" : "text-bark-600"}>
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            p.published ? "bg-leaf-100 text-leaf-700" : "bg-sand-100 text-bark-500"
                          }`}
                        >
                          {p.published ? "Published" : "Draft"}
                        </span>
                        {p.featured && (
                          <span className="rounded-full bg-caramel-100 px-2 py-0.5 text-[10px] font-semibold text-caramel-700">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ProductRowActions productId={p._id} />
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-bark-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link
            href={`/admin/products?page=${page - 1}&q=${encodeURIComponent(q)}`}
            className={`btn-secondary btn-sm ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
          >
            Previous
          </Link>
          <span className="px-3 text-sm text-bark-600">
            Page {page} of {pages}
          </span>
          <Link
            href={`/admin/products?page=${page + 1}&q=${encodeURIComponent(q)}`}
            className={`btn-secondary btn-sm ${page >= pages ? "pointer-events-none opacity-40" : ""}`}
          >
            Next
          </Link>
        </div>
      )}
    </div>
  );
}
