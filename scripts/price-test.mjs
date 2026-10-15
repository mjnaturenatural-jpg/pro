import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const root = process.cwd();
const mode = process.argv[2]; // "backup-set" or "restore"
const backupFile = path.join(root, "scripts", "price-backup.json");

const raw = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const uri = raw.split("\n").find((l) => l.replace(/\s+$/, "").startsWith("MONGODB_URI=")).replace(/^MONGODB_URI=/, "").trim();

const client = new MongoClient(uri);
await client.connect();
const db = client.db();

if (mode === "backup-set") {
  const prods = await db.collection("products").find({}, { projection: { slug: 1, packSizes: 1 } }).toArray();
  fs.writeFileSync(backupFile, JSON.stringify(prods.map((p) => ({ slug: p.slug, packSizes: p.packSizes })), null, 1));
  console.log("backed up", prods.length, "products to scripts/price-backup.json");
  const res = await db.collection("products").updateMany({}, [{ $set: { packSizes: { $map: { input: "$packSizes", as: "p", in: { $mergeObjects: ["$$p", { price: 1, mrp: 1 }] } } } } }]);
  console.log("set ₹1 — matched:", res.matchedCount, "modified:", res.modifiedCount);
} else if (mode === "restore") {
  const backup = JSON.parse(fs.readFileSync(backupFile, "utf8"));
  let n = 0;
  for (const b of backup) {
    const r = await db.collection("products").updateOne({ slug: b.slug }, { $set: { packSizes: b.packSizes } });
    n += r.modifiedCount;
  }
  console.log("restored", n, "products");
} else {
  console.error("usage: node scripts/price-test.mjs <backup-set|restore>");
  process.exit(1);
}
await client.close();
