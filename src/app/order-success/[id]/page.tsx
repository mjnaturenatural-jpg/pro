import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Package, MapPin } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { formatINR, formatDate } from "@/lib/utils";
import { OrderSuccessActions } from "@/components/order/OrderSuccessActions";
export const dynamic = "force-dynamic";

export const metadata = { title: "Order Confirmed" };

export default async function OrderSuccessPage({ params }: { params: { id: string } }) {
  await connectDB();
  const order = (await Order.findById(params.id).lean()) as unknown as {
    _id: string;
    orderNumber: string;
    paymentStatus: string;
    total: number;
    subtotal: number;
    shipping: number;
    tax: number;
    couponDiscount: number;
    couponCode: string | null;
    createdAt: string;
    items: { name: string; packSize: string; quantity: number; price: number; subtotal: number; image: string }[];
    address: {
      fullName: string;
      line1: string;
      line2: string;
      area: string;
      city: string;
      state: string;
      pincode: string;
      phone: string;
    };
    customer: { name: string; email: string };
  } | null;

  if (!order) notFound();

  return (
    <div className="container-site max-w-3xl py-14 sm:py-20">
      <div className="text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-leaf-100 text-leaf-600">
          <CheckCircle2 size={30} />
        </span>
        <h1 className="font-serif text-3xl text-bark-900 sm:text-4xl">Order Confirmed</h1>
        <p className="mt-3 text-sm text-bark-600">
          Thank you{order.customer?.name ? `, ${order.customer.name.split(" ")[0]}` : ""}! Your order
          has been received and is being prepared.
        </p>
      </div>

      <div className="mt-10 card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-bark-800/10 pb-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-bark-500">Order Number</p>
            <p className="mt-0.5 font-mono text-lg font-semibold text-bark-900">
              {order.orderNumber}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-bark-500">Date</p>
            <p className="mt-0.5 text-sm font-medium">{formatDate(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-bark-500">Payment</p>
            <p
              className={`mt-0.5 text-sm font-semibold ${
                order.paymentStatus === "PAID" ? "text-leaf-400" : "text-caramel-400"
              }`}
            >
              {order.paymentStatus}
            </p>
          </div>
        </div>

        <div className="py-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-bark-900">
            <Package size={15} /> Items
          </h2>
          <ul className="space-y-2.5">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-bark-700">
                  {item.name} <span className="text-bark-400">· {item.packSize} × {item.quantity}</span>
                </span>
                <span className="font-medium">{formatINR(item.subtotal)}</span>
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
                <dt>Coupon{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                <dd>−{formatINR(order.couponDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-bark-600">Shipping</dt>
              <dd>{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-bark-800/10 pt-2 text-base font-semibold text-bark-900">
              <dt>Total</dt>
              <dd>{formatINR(order.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="border-t border-bark-800/10 pt-5">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-bark-900">
            <MapPin size={15} /> Delivery Address
          </h2>
          <p className="text-sm leading-relaxed text-bark-600">
            {order.address.fullName}
            <br />
            {[order.address.line1, order.address.line2, order.address.area].filter(Boolean).join(", ")}
            <br />
            {order.address.city}, {order.address.state} {order.address.pincode}
            <br />
            Phone: {order.address.phone}
          </p>
        </div>

        <OrderSuccessActions orderId={order._id} orderNumber={order.orderNumber} />
      </div>
    </div>
  );
}
