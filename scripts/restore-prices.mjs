import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const root = process.cwd();
const backupFile = path.join(root, "scripts", "price-backup.json");

const raw = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const uri = raw
  .split("\n")
  .find((l) => l.replace(/\s+$/, "").startsWith("MONGODB_URI="))
  .replace(/^MONGODB_URI=/, "")
  .trim();

const backup = JSON.parse(fs.readFileSync(backupFile, "utf8"));
const bySlug = new Map(backup.map((b) => [b.slug, b]));

const client = new MongoClient(uri);
await client.connect();
const db = client.db();

const products = await db.collection("products").find({}, { projection: { slug: 1, packSizes: 1 } }).toArray();

let changed = 0;
for (const p of products) {
  const b = bySlug.get(p.slug);
  if (!b) {
    console.log("SKIP (no backup):", p.slug);
    continue;
  }
  const oldPacks = new Map(b.packSizes.map((x) => [x.label, x]));
  const nextPacks = p.packSizes.map((pack) => {
    const old = oldPacks.get(pack.label);
    if (!old) return pack;
    if (old.price === pack.price && old.mrp === pack.mrp) return pack;
    return { ...pack, price: old.price, mrp: old.mrp };
  });
  if (JSON.stringify(nextPacks) === JSON.stringify(p.packSizes)) continue;
  await db.collection("products").updateOne({ slug: p.slug }, { $set: { packSizes: nextPacks } });
  changed += 1;
  console.log(
    "RESTORED",
    p.slug,
    nextPacks.map((x) => `${x.label}: ${x.price}/${x.mrp}`).join(", ")
  );
}

const settings = await db.collection("sitesettings").findOne({});
if (settings && settings.flatShipping !== 79) {
  await db.collection("sitesettings").updateOne({ key: settings.key || "site" }, { $set: { flatShipping: 79 } });
  console.log("settings.flatShipping 0 -> 79");
}

console.log("products scanned:", products.length, "| products restored:", changed);
await client.close();
