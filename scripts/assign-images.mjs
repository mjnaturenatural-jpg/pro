/**
 * Assigns generated images from scripts/image-manifest.json into MongoDB:
 *  - products:  images[] updated ONLY when the current image is a data-URI
 *               placeholder or missing (admin/Cloudinary uploads are preserved)
 *  - categories: image set ONLY when empty
 *  - homepage:   hero/story/highlight image set ONLY when empty
 *
 * Usage: node scripts/assign-images.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const ROOT = process.cwd();
const DRY_RUN = process.argv.includes("--dry-run");

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "image-manifest.json"), "utf8"));
}

async function main() {
  const uriLine = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  const uri = (uriLine.match(/^MONGODB_URI=(.+)$/m) || [])[1];
  if (!uri) throw new Error("MONGODB_URI not found in .env.local");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.getClient().db();
  const manifest = loadManifest();

  const stats = { productsSet: 0, productsPreserved: 0, productsMissingFile: 0, categoriesSet: 0, categoriesPreserved: 0, homepageSet: 0 };
  const isPlaceholder = (img) => !img || img.startsWith("data:") || img === "";

  // Products
  for (const [key, rec] of Object.entries(manifest)) {
    if (!key.startsWith("product:") || rec.status !== "done") continue;
    const slug = key.slice("product:".length);
    const file = rec.file;
    if (!fs.existsSync(file)) {
      stats.productsMissingFile++;
      console.log(`SKIP (no file): ${slug}`);
      continue;
    }
    const doc = await db.collection("products").findOne({ slug }, { projection: { images: 1 } });
    if (!doc) {
      console.log(`SKIP (not in db): ${slug}`);
      continue;
    }
    const current = (doc.images && doc.images[0]) || "";
    if (!isPlaceholder(current)) {
      stats.productsPreserved++;
      console.log(`PRESERVE (uploaded): ${slug} -> ${current.slice(0, 60)}`);
      continue;
    }
    if (DRY_RUN) {
      console.log(`WOULD SET: ${slug} -> ${rec.publicPath}`);
      stats.productsSet++;
      continue;
    }
    await db.collection("products").updateOne({ slug }, { $set: { images: [rec.publicPath] } });
    stats.productsSet++;
    console.log(`SET: ${slug} -> ${rec.publicPath}`);
  }

  // Categories
  for (const [key, rec] of Object.entries(manifest)) {
    if (!key.startsWith("category:") || rec.status !== "done") continue;
    const slug = key.slice("category:".length);
    if (!fs.existsSync(rec.file)) continue;
    const doc = await db.collection("categories").findOne({ slug }, { projection: { image: 1 } });
    if (!doc) continue;
    if (doc.image && !doc.image.startsWith("data:")) {
      stats.categoriesPreserved++;
      continue;
    }
    if (DRY_RUN) {
      console.log(`WOULD SET category: ${slug}`);
      stats.categoriesSet++;
      continue;
    }
    await db.collection("categories").updateOne({ slug }, { $set: { image: rec.publicPath } });
    stats.categoriesSet++;
    console.log(`SET category: ${slug} -> ${rec.publicPath}`);
  }

  // Homepage content
  if (["site:hero", "site:story", "site:highlight"].every((k) => manifest[k] && manifest[k].status === "done")) {
    const hc = await db.collection("homepagecontents").findOne({ key: "homepage" });
    if (hc) {
      const patch = {};
      const setIfEmpty = (section, siteKey) => {
        const current = hc[section] && hc[section].image;
        if (!current && fs.existsSync(manifest[siteKey].file)) {
          patch[`${section}.image`] = manifest[siteKey].publicPath;
        }
      };
      setIfEmpty("hero", "site:hero");
      setIfEmpty("story", "site:story");
      setIfEmpty("highlight", "site:highlight");
      const keys = Object.keys(patch);
      if (keys.length && !DRY_RUN) {
        await db.collection("homepagecontents").updateOne({ key: "homepage" }, { $set: patch });
      }
      stats.homepageSet = keys.length;
      keys.forEach((k) => console.log(`SET homepage: ${k} -> ${patch[k]}`));
      if (DRY_RUN && keys.length) console.log(`WOULD SET homepage: ${keys.join(", ")}`);
    }
  }

  console.log("\nSummary:", JSON.stringify(stats, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
