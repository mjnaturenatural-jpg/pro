/* Delete test orders created during payment testing.
 * Usage:
 *   node scripts/cleanup-test-orders.cjs                # dry run (lists matches)
 *   node scripts/cleanup-test-orders.cjs --delete       # actually delete
 *   node scripts/cleanup-test-orders.cjs --prefix MJNMV9 --delete
 *   node scripts/cleanup-test-orders.cjs --prefix MJN --email-suffix example.com --delete
 * --email-suffix restricts matches to test emails (recommended: order-number
 * prefixes cover a ~17h window shared with real customer orders).
 */
const path = require("path");
const fs = require("fs");

const envPath = path.resolve(".env.local");
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
}

const args = process.argv.slice(2);
const doDelete = args.includes("--delete");
const pIdx = args.indexOf("--prefix");
const prefix = pIdx >= 0 ? args[pIdx + 1] : "MJNMV9";
const sIdx = args.indexOf("--email-suffix");
const emailSuffix = sIdx >= 0 ? args[sIdx + 1] : "";

const mongoose = require("mongoose");
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.db.collection("orders");
  const query = { orderNumber: { $regex: `^${prefix}` } };
  if (emailSuffix) {
    query["customer.email"] = { $regex: `${emailSuffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" };
  }
  const matches = await col
    .find(query, { projection: { orderNumber: 1, paymentStatus: 1, total: 1, "customer.email": 1 } })
    .toArray();
  console.log(`Matched ${matches.length} orders with prefix "${prefix}"${emailSuffix ? ` and email suffix "${emailSuffix}"` : ""}:`);
  for (const o of matches) console.log(`  ${o.orderNumber}  ${o.customer && o.customer.email}  ${o.paymentStatus}  ₹${o.total}`);
  if (!doDelete) {
    console.log("\nDry run. Re-run with --delete to remove them.");
  } else if (matches.length) {
    const res = await col.deleteMany({ _id: { $in: matches.map((m) => m._id) } });
    console.log(`\nDeleted ${res.deletedCount} orders.`);
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
