import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

// usage: node scripts/assign-shared.mjs <slug1,slug2> <source1.png> [source2.png ...]
const [slugArg, ...sources] = process.argv.slice(2);
const slugs = slugArg.split(",").map((s) => s.trim()).filter(Boolean);
if (slugs.length === 0 || sources.length === 0) {
  console.error("usage: node scripts/assign-shared.mjs <slug1,slug2> <source1.png> [source2.png ...]");
  process.exit(1);
}

const raw = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
const uri = raw.split("\n").find((l) => l.replace(/\s+$/, "").startsWith("MONGODB_URI=")).replace(/^MONGODB_URI=/, "").trim();

const dir = path.join(process.cwd(), "public", "images", "products");
sources.forEach((s) => {
  if (!fs.existsSync(path.join(dir, s))) throw new Error("missing source " + s);
});

const client = new MongoClient(uri);
await client.connect();
for (const slug of slugs) {
  const targets = sources.map((_, i) => `${slug}-${i + 1}.png`);
  sources.forEach((s, i) => fs.copyFileSync(path.join(dir, s), path.join(dir, targets[i])));
  const images = targets.map((t) => `/images/products/${t}`);
  const res = await client.db().collection("products").updateOne({ slug }, { $set: { images } });
  console.log("slug:", slug, "matched:", res.matchedCount, "modified:", res.modifiedCount);
  console.log("images:", images);
}
await client.close();

sources.forEach((s) => fs.unlinkSync(path.join(dir, s)));
console.log("deleted source screenshots:", sources.length);
