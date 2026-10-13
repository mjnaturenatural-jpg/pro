import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const [slug, ...sources] = process.argv.slice(2);
if (!slug || sources.length === 0) {
  console.error("usage: node scripts/append.mjs <slug> <source1.png> [source2.png ...]");
  process.exit(1);
}

const raw = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
const uri = raw.split("\n").find((l) => l.replace(/\s+$/, "").startsWith("MONGODB_URI=")).replace(/^MONGODB_URI=/, "").trim();

const dir = path.join(process.cwd(), "public", "images", "products");
const client = new MongoClient(uri);
await client.connect();
const col = client.db().collection("products");
const product = await col.findOne({ slug });
if (!product) throw new Error("no product " + slug);

const existing = (product.images || []).filter((i) => fs.existsSync(path.join(process.cwd(), "public", i.replace(/^\//, ""))));
const start = existing.length + 1;
const targets = sources.map((_, i) => `${slug}-${start + i}.png`);
sources.forEach((s, i) => {
  if (!fs.existsSync(path.join(dir, s))) throw new Error("missing source " + s);
  fs.copyFileSync(path.join(dir, s), path.join(dir, targets[i]));
});
const images = [...existing, ...targets.map((t) => `/images/products/${t}`)];

const res = await col.updateOne({ slug }, { $set: { images } });
console.log("slug:", slug, "matched:", res.matchedCount, "modified:", res.modifiedCount);
console.log("images:", images);
await client.close();

sources.forEach((s) => fs.unlinkSync(path.join(dir, s)));
console.log("deleted source screenshots:", sources.length);
