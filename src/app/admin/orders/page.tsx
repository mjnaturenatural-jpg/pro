import Link from "next/link";
import { guardAdmin } from "@/lib/admin-guard";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { formatINR, formatDate, orderNumber } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; payment?: string; page?: string };
}) {
  await guardAdmin("/admin/orders");
  await connectDB();

  const q = searchParams.q || "";
  const status = searchParams.status || "";
  const payment = searchParams.payment || "";
  const page = Math.max(1, Number(searchParams.page || 1));
  const limit = 20;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (payment) filter.paymentStatus = payment;
  if (q) {
    const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    filter.$or = [
      { orderNumber: rx },
      { "customer.name": rx },
      { "customer.email": rx },
      { "customer.phone": rx },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);
  const pages = Math.ceil(total / limit);

  const qs = (patch: Record<string, string>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (payment) params.set("payment", payment);
    Object.entries(patch).forEach(([k, v]) => (v ? params.set(k, v) : params.delete(k)));
    return `/admin/orders?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-bark-900">Orders</h1>
        <p className="text-sm text-bark-500">{total} orders</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <form className="flex min-w-[240px] items-center gap-2 rounded-lg border border-bark-800/10 bg-white px-3 py-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by number, name, email…"
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </form>
        <select
          defaultValue={status}
          onChange={() => {}}
          className="hidden"
          aria-hidden
        />
        <div className="flex flex-wrap gap-2">
          <Link href={qs({ status: "", payment: "", page: "" })} className={`btn-sm rounded-full border px-3 py-1.5 text-xs font-medium ${!status && !payment ? "border-bark-800 bg-bark-800 text-ivory-50" : "border-bark-800/15 text-bark-600"}`}>
            All
          </Link>
          {ORDER_STATUSES.filter((s) => s !== "PENDING").map((s) => (
            <Link
              key={s}
              href={qs({ status: status === s ? "" : s, page: "" })}
              className={`btn-sm rounded-full border px-3 py-1.5 text-xs font-medium ${status === s ? "border-bark-800 bg-bark-800 text-ivory-50" : "border-bark-800/15 text-bark-600"}`}
            >
              {s.replace(/_/g, " ")}
            </Link>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ivory-100 text-left text-[11px] uppercase tracking-wide text-bark-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Shipping</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bark-800/5">
              {orders.map((raw) => {
                const o = raw as unknown as {
                  _id: string;
                  customer: { name: string; email: string };
                  total: number;
                  paymentStatus: string;
                  status: string;
                  createdAt: string;
                };
                return (
                  <tr key={o._id} className="hover:bg-ivory-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o._id}`}
                        className="font-mono text-xs font-semibold text-bark-800 hover:text-caramel-600"
                      >
                        {orderNumber(o._id)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-bark-800">{o.customer.name}</p>
                      <p className="text-[11px] text-bark-400">{o.customer.email}</p>
                    </td>
                    <td className="px-4 py-3 text-bark-600">{formatDate(o.createdAt)}</td>
                    <td className="px-4 py-3 font-medium">{formatINR(o.total)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold ${
                          o.paymentStatus === "PAID"
                            ? "text-leaf-600"
                            : o.paymentStatus === "FAILED"
                              ? "text-red-500"
                              : o.paymentStatus === "REFUNDED"
                                ? "text-blue-600"
                                : "text-caramel-600"
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/orders/${o._id}`} className="btn-secondary btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-bark-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link href={qs({ page: String(page - 1) })} className={`btn-secondary btn-sm ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}>
            Previous
          </Link>
          <span className="px-3 text-sm text-bark-600">
            Page {page} of {pages}
          </span>
          <Link href={qs({ page: String(page + 1) })} className={`btn-secondary btn-sm ${page >= pages ? "pointer-events-none opacity-40" : ""}`}>
            Next
          </Link>
        </div>
      )}
    </div>
  );
}
