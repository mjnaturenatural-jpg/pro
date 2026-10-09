import Link from "next/link";
import { guardAdmin } from "@/lib/admin-guard";
import { connectDB } from "@/lib/db";
import { Order, Product, User, Category, Review } from "@/models";
import { formatINR, formatDate, orderNumber } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { RevenueChart } from "@/components/admin/RevenueChart";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await guardAdmin("/admin");
  await connectDB();

  const [totalOrders, paidOrders, pendingOrders, totalProducts, totalCustomers, pendingReviews] =
    await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: "PAID" }),
      Order.countDocuments({ paymentStatus: "PENDING" }),
      Product.countDocuments(),
      User.countDocuments({ role: "CUSTOMER" }),
      Review.countDocuments({ approved: false }),
    ]);

  const revenueAgg = await Order.aggregate([
    { $match: { paymentStatus: "PAID" } },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ]);
  const revenue = revenueAgg[0]?.total || 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const revenueByDay = await Order.aggregate([
    { $match: { paymentStatus: "PAID", createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 as const } },
  ]);

  const recentOrders = (await Order.find().sort({ createdAt: -1 }).limit(8).lean()) as unknown as {
    _id: string;
    orderNumber: string;
    customer: { name: string };
    total: number;
    paymentStatus: string;
    status: string;
    createdAt: string;
  }[];

  const recentCustomers = (await User.find({ role: "CUSTOMER" })
    .sort({ createdAt: -1 })
    .limit(6)
    .select("name email createdAt")
    .lean()) as unknown as { _id: string; name: string; email: string; createdAt: string }[];

  const topProducts = (await Product.find({ totalSold: { $gt: 0 } })
    .sort({ totalSold: -1 })
    .limit(6)
    .select("name totalSold images packSizes.price")
    .lean()) as unknown as {
    _id: string;
    name: string;
    slug: string;
    totalSold: number;
    images: string[];
    packSizes: { price: number }[];
  }[];

  const allProducts = (await Product.find()
    .select("name slug packSizes stock")
    .limit(200)
    .lean()) as unknown as {
    name: string;
    slug: string;
    packSizes: { label: string; stock: number }[];
  }[];

  const lowStock = allProducts
    .map((p) => {
      const low = p.packSizes.filter((ps) => ps.stock <= 5);
      return low.length ? { name: p.name, slug: p.slug, packSizes: low } : null;
    })
    .filter(Boolean) as { name: string; slug: string; packSizes: { label: string; stock: number }[] }[];

  const CARD_ACCENTS = [
    "border-l-leaf-500",
    "border-l-honey-500",
    "border-l-caramel-500",
    "border-l-berry-500",
  ];

  const cards = [
    { label: "Total Orders", value: totalOrders.toString(), href: "/admin/orders" },
    { label: "Total Revenue", value: formatINR(revenue), href: "/admin/orders?payment=PAID" },
    { label: "Paid Orders", value: paidOrders.toString(), href: "/admin/orders?payment=PAID" },
    { label: "Pending Payments", value: pendingOrders.toString(), href: "/admin/orders?payment=PENDING" },
    { label: "Products", value: totalProducts.toString(), href: "/admin/products" },
    { label: "Customers", value: totalCustomers.toString(), href: "/admin/customers" },
    { label: "Low Stock Items", value: lowStock.length.toString(), href: "/admin/inventory" },
    { label: "Pending Reviews", value: pendingReviews.toString(), href: "/admin/reviews" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-bark-900 sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-bark-500">Overview of your store performance.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c, i) => (
          <Link
            key={c.label}
            href={c.href}
            className={`card border-l-4 p-4 transition hover:shadow-lift sm:p-5 ${CARD_ACCENTS[i % CARD_ACCENTS.length]}`}
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-bark-500">
              {c.label}
            </p>
            <p className="mt-1.5 font-serif text-xl text-bark-900 sm:text-2xl">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-bark-700">
            Revenue — last 30 days
          </h2>
          <RevenueChart
            data={revenueByDay.map((d) => ({
              label: d._id,
              revenue: d.revenue,
              orders: d.orders,
            }))}
          />
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-bark-700">
            Top Selling Products
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-bark-500">No sales yet.</p>
          ) : (
            <ul className="space-y-3">
              {topProducts.map((p) => (
                <li key={p._id} className="flex items-center justify-between gap-3">
                  <Link
                    href={`/product/${p.slug}`}
                    className="truncate text-sm text-bark-700 hover:text-caramel-600"
                  >
                    {p.name}
                  </Link>
                  <span className="shrink-0 text-xs font-semibold text-bark-900">
                    {p.totalSold} sold
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-bark-700">
              Recent Orders
            </h2>
            <Link href="/admin/orders" className="text-xs font-medium text-caramel-600 hover:text-caramel-700">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-bark-500">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-bark-800/10 text-left text-[11px] uppercase tracking-wide text-bark-500">
                    <th className="pb-2 pr-3">Order</th>
                    <th className="pb-2 pr-3">Customer</th>
                    <th className="pb-2 pr-3">Total</th>
                    <th className="pb-2 pr-3">Payment</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bark-800/5">
                  {recentOrders.map((o) => (
                    <tr key={o._id}>
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/admin/orders/${o._id}`}
                          className="font-mono text-xs font-semibold text-bark-800 hover:text-caramel-600"
                        >
                          {orderNumber(o._id)}
                        </Link>
                        <p className="text-[11px] text-bark-400">{formatDate(o.createdAt)}</p>
                      </td>
                      <td className="py-2.5 pr-3 text-bark-700">{o.customer.name}</td>
                      <td className="py-2.5 pr-3 font-medium">{formatINR(o.total)}</td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`text-xs font-semibold ${
                            o.paymentStatus === "PAID"
                              ? "text-leaf-600"
                              : o.paymentStatus === "FAILED"
                                ? "text-red-500"
                                : "text-caramel-600"
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-bark-700">
              Recent Customers
            </h2>
            <Link href="/admin/customers" className="text-xs font-medium text-caramel-600 hover:text-caramel-700">
              View all
            </Link>
          </div>
          {recentCustomers.length === 0 ? (
            <p className="text-sm text-bark-500">No customers yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentCustomers.map((c) => (
                <li key={c._id}>
                  <p className="text-sm font-medium text-bark-800">{c.name}</p>
                  <p className="text-xs text-bark-500">{c.email}</p>
                  <p className="text-[11px] text-bark-400">Joined {formatDate(c.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="card border-amber-200 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-700">
            Low Stock Alerts (≤ 5)
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.slice(0, 12).map((p) => (
              <li key={`${p.name}-${p.packSizes[0]?.label}`} className="rounded-lg bg-amber-50 px-3 py-2">
                <p className="truncate text-xs font-medium text-bark-800">{p.name}</p>
                <p className="text-[11px] text-amber-700">
                  {p.packSizes.map((ps) => `${ps.label}: ${ps.stock}`).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
