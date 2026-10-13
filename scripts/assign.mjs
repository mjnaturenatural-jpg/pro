import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const [slug, ...sources] = process.argv.slice(2);
if (!slug || sources.length === 0) {
  console.error("usage: node scripts/assign.mjs <slug> <source1.png> [source2.png ...]");
  process.exit(1);
}

const raw = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
const uri = raw.split("\n").find((l) => l.replace(/\s+$/, "").startsWith("MONGODB_URI=")).replace(/^MONGODB_URI=/, "").trim();

const dir = path.join(process.cwd(), "public", "images", "products");
const targets = sources.map((_, i) => `${slug}-${i + 1}.png`);
sources.forEach((s, i) => {
  if (!fs.existsSync(path.join(dir, s))) throw new Error("missing source " + s);
  fs.copyFileSync(path.join(dir, s), path.join(dir, targets[i]));
});
const images = targets.map((t) => `/images/products/${t}`);

const client = new MongoClient(uri);
await client.connect();
const res = await client.db().collection("products").updateOne({ slug }, { $set: { images } });
console.log("slug:", slug, "matched:", res.matchedCount, "modified:", res.modifiedCount);
console.log("images:", images);
await client.close();

sources.forEach((s) => fs.unlinkSync(path.join(dir, s)));
console.log("deleted source screenshots:", sources.length);
