import { guardAdmin } from "@/lib/admin-guard";
import { connectDB } from "@/lib/db";
import { HomepageContent, Product, Category } from "@/models";
import { ContentEditor } from "@/components/admin/ContentEditor";

export const metadata = { title: "Content" };
export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  await guardAdmin("/admin/content");
  await connectDB();

  let content = await HomepageContent.findOne({ key: "homepage" }).lean();
  if (!content) content = await HomepageContent.create({ key: "homepage" });

  const [products, categories] = await Promise.all([
    Product.find({ published: true })
      .select("name slug")
      .sort({ name: 1 })
      .limit(200)
      .lean(),
    Category.find({ published: true }).select("name slug").sort({ name: 1 }).lean(),
  ]);

  return (
    <ContentEditor
      content={JSON.parse(JSON.stringify(content))}
      products={JSON.parse(JSON.stringify(products))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
