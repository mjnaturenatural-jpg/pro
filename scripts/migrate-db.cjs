/* One-way migration: copy app collections from source DB to target DB.
 * Usage: node scripts/migrate-db.cjs "<SOURCE_URI>" "<TARGET_URI>"
 * Target's existing data for these collections is backed up first.
 */
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const COLLECTIONS = [
  "products",
  "categories",
  "coupons",
  "orders",
  "reviews",
  "users",
  "newslettersubscribers",
  "homepagecontents",
  "sitesettings",
];

const sourceUri = process.argv[2];
const targetUri = process.argv[3];
if (!sourceUri || !targetUri) {
  console.error('usage: node scripts/migrate-db.cjs "<SOURCE_URI>" "<TARGET_URI>"');
  process.exit(1);
}

(async () => {
  const src = new MongoClient(sourceUri, { serverSelectionTimeoutMS: 15000 });
  const dst = new MongoClient(targetUri, { serverSelectionTimeoutMS: 15000 });
  await src.connect();
  await dst.connect();
  const sdb = src.db();
  const tdb = dst.db();

  // 1. Back up whatever the target currently has in these collections.
  const backup = {};
  for (const col of COLLECTIONS) {
    backup[col] = await tdb.collection(col).find({}).toArray();
  }
  const backupFile = path.join(process.cwd(), "scripts", "db-migration-backup.json");
  fs.writeFileSync(backupFile, JSON.stringify(backup));
  console.log("target backup written:", backupFile);

  // 2. Copy each collection, preserving _ids.
  for (const col of COLLECTIONS) {
    const docs = await sdb.collection(col).find({}).toArray();
    await tdb.collection(col).drop().catch(() => {});
    if (docs.length) {
      await tdb.collection(col).insertMany(docs, { ordered: false });
    }
    const targetCount = await tdb.collection(col).countDocuments();
    console.log(`${col}: ${docs.length} copied -> target has ${targetCount}`);
  }

  await src.close();
  await dst.close();
  console.log("migration complete");
})().catch((e) => {
  console.error("migration failed:", e.message);
  process.exit(1);
});
