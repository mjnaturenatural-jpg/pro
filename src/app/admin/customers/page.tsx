import Link from "next/link";
import { guardAdmin } from "@/lib/admin-guard";
import { connectDB } from "@/lib/db";
import { User, Order } from "@/models";
import { formatINR, formatDate } from "@/lib/utils";

export const metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  await guardAdmin("/admin/customers");
  await connectDB();

  const q = searchParams.q || "";
  const page = Math.max(1, Number(searchParams.page || 1));
  const limit = 20;
  const filter: Record<string, unknown> = { role: "CUSTOMER" };
  if (q) {
    const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("name email phone createdAt")
      .lean(),
    User.countDocuments(filter),
  ]);

  const stats = await Order.aggregate([
    { $match: { user: { $in: users.map((u) => (u as { _id: unknown })._id) } } },
    {
      $group: {
        _id: "$user",
        orderCount: { $sum: 1 },
        totalSpent: { $sum: "$total" },
        lastOrder: { $max: "$createdAt" },
      },
    },
  ]);
  const statsMap = new Map(stats.map((s) => [s._id.toString(), s]));
  const pages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-bark-900">Customers</h1>
        <p className="text-sm text-bark-500">{total} customers</p>
      </div>

      <form className="flex max-w-md items-center gap-2 rounded-lg border border-bark-800/10 bg-white px-3 py-2">
        <input name="q" defaultValue={q} placeholder="Search name, email, phone…" className="w-full bg-transparent text-sm focus:outline-none" />
      </form>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ivory-100 text-left text-[11px] uppercase tracking-wide text-bark-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total Spent</th>
                <th className="px-4 py-3">Last Order</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bark-800/5">
              {users.map((raw) => {
                const u = raw as unknown as { _id: string; name: string; email: string; phone: string; createdAt: string };
                const s = statsMap.get(u._id);
                return (
                  <tr key={u._id} className="hover:bg-ivory-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-bark-900">{u.name}</p>
                      <p className="text-[11px] text-bark-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-bark-600">{u.phone || "—"}</td>
                    <td className="px-4 py-3 font-medium">{s?.orderCount || 0}</td>
                    <td className="px-4 py-3 font-medium">{formatINR(s?.totalSpent || 0)}</td>
                    <td className="px-4 py-3 text-bark-600">
                      {s?.lastOrder ? formatDate(s.lastOrder) : "—"}
                    </td>
                    <td className="px-4 py-3 text-bark-600">{formatDate(u.createdAt)}</td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-bark-500">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link href={`/admin/customers?page=${page - 1}&q=${encodeURIComponent(q)}`} className={`btn-secondary btn-sm ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}>
            Previous
          </Link>
          <span className="px-3 text-sm text-bark-600">Page {page} of {pages}</span>
          <Link href={`/admin/customers?page=${page + 1}&q=${encodeURIComponent(q)}`} className={`btn-secondary btn-sm ${page >= pages ? "pointer-events-none opacity-40" : ""}`}>
            Next
          </Link>
        </div>
      )}
    </div>
  );
}
