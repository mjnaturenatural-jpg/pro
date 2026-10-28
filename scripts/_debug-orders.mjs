import dns, { promises as dnsPromises } from "node:dns";
import mongoose from "mongoose";
import fs from "node:fs";

const servers = ["1.1.1.1", "8.8.8.8"];
dns.setServers(servers);
const resolver = new dnsPromises.Resolver();
resolver.setServers(servers);
dnsPromises.resolveSrv = (name) => resolver.resolveSrv(name);
dnsPromises.resolveTxt = (name) => resolver.resolveTxt(name);

const env = fs.readFileSync(".env.local", "utf8");
const uri = env.match(/MONGODB_URI=(.*)/)?.[1]?.trim();
await mongoose.connect(uri, { bufferCommands: false });
const orders = await mongoose.connection.db
  .collection("orders")
  .find({})
  .sort({ createdAt: -1 })
  .limit(30)
  .toArray();
console.log("count", orders.length);
for (const o of orders) {
  const problems = [];
  if (!o.customer) problems.push("no customer");
  else {
    if (!o.customer.name) problems.push("no customer.name");
    if (!o.customer.email) problems.push("no customer.email");
  }
  if (o.total == null) problems.push("no total");
  if (!o.status) problems.push("no status");
  if (!o.paymentStatus) problems.push("no paymentStatus");
  if (!o.createdAt) problems.push("no createdAt");
  console.log(String(o._id), o.orderNumber, o.status, o.paymentStatus, "problems:", problems.join(", ") || "none");
}
await mongoose.disconnect();
