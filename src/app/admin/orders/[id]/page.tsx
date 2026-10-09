import { guardAdmin } from "@/lib/admin-guard";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { formatINR, formatDate, orderNumber } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminOrderActions } from "@/components/admin/AdminOrderActions";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";

export const metadata = { title: "Order Detail" };
export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  await guardAdmin(`/admin/orders/${params.id}`);
  await connectDB();

  const order = (await Order.findById(params.id).lean()) as unknown as
    | {
        _id: string;
        orderNumber: string;
        customer: { name: string; email: string; phone: string };
        address: Record<string, string>;
        items: {
          name: string;
          image: string;
          packSize: string;
          quantity: number;
          price: number;
          mrp: number;
          subtotal: number;
        }[];
        subtotal: number;
        couponCode: string | null;
        couponDiscount: number;
        shipping: number;
        tax: number;
        total: number;
        paymentStatus: string;
        status: string;
        razorpayOrderId: string;
        razorpayPaymentId: string;
        createdAt: string;
        notes: string;
        awb: string;
        trackingUrl: string;
        shippingProvider: string;
        shipmentStatus: string;
        shipmentHistory: { status: string; location: string; timestamp: string }[];
      }
    | null;

  if (!order) {
    return <p className="py-12 text-center text-bark-500">Order not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-bark-900">{orderNumber(order._id)}</h1>
          <p className="mt-1 text-sm text-bark-500">Placed {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <span
            className={`text-sm font-semibold ${
              order.paymentStatus === "PAID" ? "text-leaf-400" : "text-caramel-400"
            }`}
          >
            {order.paymentStatus}
          </span>
        </div>
      </div>

      <AdminOrderActions
        orderId={order._id}
        status={order.status}
        paymentStatus={order.paymentStatus}
        awb={order.awb}
        trackingUrl={order.trackingUrl}
        statuses={[...ORDER_STATUSES]}
        paymentStatuses={[...PAYMENT_STATUSES]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-bark-700">Items</h2>
            <ul className="divide-y divide-bark-800/5">
              {order.items.map((item, i) => (
                <li key={i} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-bark-900">{item.name}</p>
                    <p className="mt-0.5 text-xs text-bark-500">
                      {item.packSize} × {item.quantity} @ {formatINR(item.price)} (MRP {formatINR(item.mrp)})
                    </p>
                  </div>
                  <p className="text-sm font-medium">{formatINR(item.subtotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-bark-800/10 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-bark-600">Subtotal</dt>
                <dd>{formatINR(order.subtotal)}</dd>
              </div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-leaf-400">
                  <dt>Coupon {order.couponCode}</dt>
                  <dd>−{formatINR(order.couponDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-bark-600">Shipping</dt>
                <dd>{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</dd>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <dt className="text-bark-600">Tax</dt>
                  <dd>{formatINR(order.tax)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-bark-800/10 pt-2 text-base font-semibold text-bark-900">
                <dt>Total</dt>
                <dd>{formatINR(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-bark-700">
              Payment Details
            </h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-bark-400">Razorpay Order ID</dt>
                <dd className="break-all font-mono text-xs">{order.razorpayOrderId || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-bark-400">Razorpay Payment ID</dt>
                <dd className="break-all font-mono text-xs">{order.razorpayPaymentId || "—"}</dd>
              </div>
            </dl>
          </div>

          {order.awb && (
            <div className="card p-5">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-bark-700">
                Shipment
              </h2>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-bark-400">Provider</dt>
                  <dd>{order.shippingProvider || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-bark-400">AWB</dt>
                  <dd className="font-mono text-xs">{order.awb}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-bark-400">Status</dt>
                  <dd>{order.shipmentStatus || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-bark-400">Tracking</dt>
                  <dd>
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-caramel-400 hover:underline"
                      >
                        Open tracking
                      </a>
                    )}
                  </dd>
                </div>
              </dl>
              {order.shipmentHistory?.length > 0 && (
                <ul className="mt-4 space-y-1.5 border-t border-bark-800/10 pt-3 text-xs text-bark-600">
                  {[...order.shipmentHistory].reverse().map((s, i) => (
                    <li key={i}>
                      <span className="font-medium">{s.status}</span>
                      {s.location ? ` · ${s.location}` : ""} — {formatDate(s.timestamp)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-bark-700">
              Customer
            </h2>
            <p className="text-sm leading-relaxed text-bark-600">
              <strong className="text-bark-900">{order.customer.name}</strong>
              <br />
              {order.customer.email}
              <br />
              {order.customer.phone}
            </p>
          </div>
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-bark-700">
              Delivery Address
            </h2>
            <p className="text-sm leading-relaxed text-bark-600">
              {order.address.fullName}
              <br />
              {[order.address.line1, order.address.line2, order.address.area].filter(Boolean).join(", ")}
              <br />
              {order.address.city}, {order.address.state} {order.address.pincode}
            </p>
          </div>
          {order.notes && (
            <div className="card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-bark-700">Notes</h2>
              <p className="text-sm text-bark-600">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
