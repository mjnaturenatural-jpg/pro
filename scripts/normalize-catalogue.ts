import { loadEnvConfig } from "@next/env";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";

loadEnvConfig(process.cwd());

const apply = process.argv.includes("--apply");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

type CategoryRecord = { _id: { toString(): string }; name: string; slug: string; description?: string; image?: string };
type ProductRecord = { _id: { toString(): string }; slug: string; name: string; category?: { toString(): string }; published: boolean };

type Target = { name: string; slug: string; aliases: string[]; description?: string };
const targets: Target[] = [
  { name: "CHIKKIS", slug: "chikkis", aliases: ["chikki", "chikkis"] },
  { name: "COOKIES", slug: "cookies", aliases: ["cookies", "millet-cookies"] },
  { name: "BROWNIES", slug: "brownies", aliases: ["brownies", "brownie"] },
  { name: "OTHERS", slug: "others", aliases: [], description: "Oils, powders, and other natural pantry essentials." },
];

async function main() {
  const { connectDB } = await import("../src/lib/db");
  const { Category, Product } = await import("../src/models");
  await connectDB();

  const categories = (await Category.find().lean()) as unknown as CategoryRecord[];
  const products = (await Product.find().select("name slug category published").lean()) as unknown as ProductRecord[];
  const backupDir = path.join(process.cwd(), "catalogue-backups");
  await fs.mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `before-normalize-${timestamp}.json`);
  await fs.writeFile(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), categories, products }, null, 2));

  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const canonical = new Map<string, CategoryRecord>();
  for (const target of targets) {
    const matches = categories.filter((category) => category.slug === target.slug || category.name.toLowerCase() === target.name.toLowerCase());
    if (matches.length > 1) throw new Error(`Multiple categories match ${target.name}; resolve duplicates in admin before migration.`);
    const existing = matches[0] || target.aliases.map((slug) => bySlug.get(slug)).find(Boolean);
    if (existing) canonical.set(target.slug, existing);
  }

  const categoryPlan = targets.map((target, index) => ({
    target,
    existing: canonical.get(target.slug),
    order: index + 1,
  }));
  const oldCategoryTarget = new Map<string, string>();
  for (const category of categories) {
    const target = targets.find((item) => item.aliases.includes(category.slug));
    oldCategoryTarget.set(category._id.toString(), target?.slug || "others");
  }

  const kaju = products.find((product) => product.slug === "kaju-jaggery-chikki");
  const unresolved = products.filter((product) => !product.category).map((product) => ({ id: product._id.toString(), name: product.name }));
  const summary = {
    backupPath,
    dryRun: !apply,
    categories: categoryPlan.map(({ target, existing, order }) => ({ target: target.name, source: existing?.name || "new", order })),
    products: products.length,
    kajuChikki: kaju ? { id: kaju._id.toString(), published: kaju.published, willRestore: !kaju.published } : "MISSING",
    unresolved,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!apply) {
    await mongoose.disconnect();
    return;
  }
  if (unresolved.length) throw new Error("Products without a category were not changed. Review the backup and assign them in admin first.");

  for (const { target, existing, order } of categoryPlan) {
    if (existing) {
      await Category.updateOne({ _id: existing._id }, { $set: { name: target.name, slug: target.slug, order, published: true } });
    } else {
      const created = await Category.create({ name: target.name, slug: target.slug, description: target.description || "", published: true, order });
      canonical.set(target.slug, created.toObject() as CategoryRecord);
    }
  }

  const targetIds = new Map(Array.from(canonical.entries()).map(([slug, category]) => [slug, category._id]));
  for (const [oldId, targetSlug] of Array.from(oldCategoryTarget.entries())) {
    await Product.updateMany({ category: oldId }, { $set: { category: targetIds.get(targetSlug) } });
  }
  if (kaju) {
    await Product.updateOne({ _id: kaju._id }, { $set: { category: targetIds.get("chikkis"), published: true } });
  }

  const canonicalIds = Array.from(targetIds.values()).map((id) => id.toString());
  await Category.updateMany({ _id: { $nin: canonicalIds } }, { $set: { published: false, order: 999 } });
  console.log(`Applied catalogue normalization. Backup: ${backupPath}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  mongoose.disconnect().finally(() => process.exit(1));
});
