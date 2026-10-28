import { connectDB } from "../src/lib/db";
import { Product } from "../src/models";

async function main() {
  try {
    await connectDB();
    const result = await Product.updateMany(
      {},
      { $set: { "packSizes.$[].stock": 2000 } }
    );
    console.log("matched:", result.matchedCount, "modified:", result.modifiedCount);
    process.exit(0);
  } catch (err) {
    console.error("error:", err);
    process.exit(1);
  }
}

main();
