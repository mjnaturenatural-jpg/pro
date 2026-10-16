import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Package, MapPin, CreditCard, Clock, Truck, LifeBuoy } from "lucide-react";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { formatPrice } from "@/lib/format";
import { getWhatsAppLink } from "@/lib/whatsapp";
import {
  OrderStatusPoller,
  FailedOrderActions,
} from "@/components/order/OrderStatusPoller";
import { OrderSuccessActions } from "@/components/order/OrderSuccessActions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Order Status" };

function ist(d: Date | string | null | undefined) {
  if (!d) return "";
  return (
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date(d)) + " IST"
  );
}

const METHOD_LABELS: Record<string, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Netbanking",
  wallet: "Wallet",
  emi: "EMI",
  card_less_emi: "Cardless EMI",
};

interface SuccessOrder {
  _id: string;
  orderNumber: string;
  paymentStatus: string;
  status: string;
  paymentMethod: string;
  razorpayPaymentId: string;
  createdAt: Date | string;
  paidAt: Date | string | null;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode: string | null;
  couponDiscount: number;
  notes: string;
  awb: string;
  trackingUrl: string;
  shippingProvider: string;
  items: {
    name: string;
    packSize: string;
    quantity: number;
    price: number;
    mrp: number;
    subtotal: number;
    image: string;
  }[];
  address: {
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
  };
  customer: { name: string; email: string };
  accessToken: string;
}

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { token?: string };
}) {
  await connectDB();
  const token = searchParams.token || "";
  const order = (await Order.findById(params.id).lean()) as unknown as SuccessOrder | null;

  if (!order || !token || token !== order.accessToken) {
    return (
      <div className="container-site max-w-lg py-20 text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-bark-800/5 text-bark-400">
          <LifeBuoy size={26} />
        </span>
        <h1 className="font-serif text-3xl text-bark-900">Order link not valid</h1>
        <p className="mt-3 text-sm text-bark-600">
          This confirmation link is incomplete or has been replaced. Please use the link from your
          payment confirmation, or contact us with your name and phone number and we&apos;ll resend it.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="btn-primary">
            Contact Us
          </Link>
          <Link href="/shop" className="btn-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === "PAID";
  const isFailed = order.paymentStatus === "FAILED";
  const waLink = getWhatsAppLink(
    `Hi! I need help with my order ${order.orderNumber}.`
  );

  return (
    <div className="container-site max-w-3xl py-12 sm:py-16 print:py-0 print:max-w-none">
      {/* Status hero */}
      <div className="text-center">
        <span
          className={
            isPaid
              ? "mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-leaf-100 text-leaf-600"
              : isFailed
                ? "mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-chilli-100 text-chilli-600"
                : "mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-caramel-100 text-caramel-700"
          }
        >
          {isPaid ? <CheckCircle2 size={30} /> : <Clock size={28} />}
        </span>
        <h1 className="font-serif text-3xl text-bark-900 sm:text-4xl">
          {isPaid ? "Payment Successful" : isFailed ? "Payment Failed" : "Payment Processing"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-bark-600">
          {isPaid ? (
            <>
              Thank you{order.customer?.name ? `, ${order.customer.name.split(" ")[0]}` : ""}! Your
              payment is confirmed and your order is being prepared with care.
            </>
          ) : isFailed ? (
            <>
              Your payment did not go through and <strong>no money has been charged</strong>. Your
              cart is intact — please try again or reach out for help.
            </>
          ) : (
            <>
              We are confirming your payment with the bank. This usually takes under a minute — if
              you were debited, it will confirm automatically. Do not pay again.
            </>
          )}
        </p>
        {!isPaid && <OrderStatusPoller orderId={order._id} token={token} />}
        {isFailed && <FailedOrderActions />}
      </div>

      {/* Order card */}
      <div className="card mt-10 p-6 sm:p-8 print:border-0 print:p-0 print:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-bark-800/10 pb-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-bark-500">Order Number</p>
            <p className="mt-0.5 font-mono text-lg font-semibold text-bark-900">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-bark-500">Placed</p>
            <p className="mt-0.5 text-sm font-medium">{ist(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-bark-500">Payment</p>
            <p
              className={`mt-0.5 text-sm font-semibold ${
                isPaid ? "text-leaf-600" : isFailed ? "text-chilli-600" : "text-caramel-600"
              }`}
            >
              {isPaid ? "Paid" : order.paymentStatus}
              {order.razorpayPaymentId ? ` · ${order.razorpayPaymentId}` : ""}
            </p>
            {isPaid && order.paymentMethod && (
              <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-bark-500">
                <CreditCard size={11} />
                {METHOD_LABELS[order.paymentMethod] || order.paymentMethod.toUpperCase()}
                {order.paidAt ? ` · ${ist(order.paidAt)}` : ""}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-bark-500">Order Status</p>
            <p className="mt-0.5 text-sm font-semibold text-bark-800">
              {order.status.replace(/_/g, " ")}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="py-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-bark-900">
            <Package size={15} /> Items
          </h2>
          <ul className="space-y-3">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sand-50">
                  {item.image && (
                    <Image src={item.image} alt="" fill sizes="56px" className="object-contain p-1" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-bark-900">{item.name}</p>
                  <p className="text-xs text-bark-500">
                    {item.packSize} × {item.quantity} · {formatPrice(item.price)} each
                    {item.mrp > item.price && (
                      <span className="ml-1.5 text-bark-400 line-through">{formatPrice(item.mrp)}</span>
                    )}
                  </p>
                </div>
                <p className="text-sm font-semibold text-bark-900">{formatPrice(item.subtotal)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-bark-800/10 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-bark-600">Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            {order.couponDiscount > 0 && (
              <div className="flex justify-between text-leaf-600">
                <dt>Coupon{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                <dd>−{formatPrice(order.couponDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-bark-600">Delivery</dt>
              <dd>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</dd>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between">
                <dt className="text-bark-600">Tax</dt>
                <dd>{formatPrice(order.tax)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-bark-800/10 pt-2 text-base font-semibold text-bark-900">
              <dt>{isPaid ? "Amount Paid" : "Total"}</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>

        {/* Address */}
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
            {order.customer?.email && (
              <>
                <br />
                Email: {order.customer.email}
              </>
            )}
          </p>
          {order.notes && (
            <p className="mt-2 text-xs text-bark-500">Note: {order.notes}</p>
          )}
        </div>

        {order.awb && (
          <div className="mt-5 rounded-2xl bg-leaf-50 px-5 py-4 text-center">
            <p className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-leaf-700">
              <Truck size={13} />
              Shipment {order.shippingProvider ? `via ${order.shippingProvider.replace("Shiprocket:", "")}` : "created"} · AWB {order.awb}
            </p>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary btn-sm mt-3"
              >
                Track Your Shipment
              </a>
            )}
          </div>
        )}

        <OrderSuccessActions
          orderId={order._id}
          orderNumber={order.orderNumber}
          token={token}
          showReceipt={isPaid}
        />
      </div>

      {/* Support */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-center text-sm text-bark-500 print:hidden">
        <span className="flex items-center gap-1.5">
          <LifeBuoy size={14} /> Need help with this order?
        </span>
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-leaf-700 hover:underline">
          WhatsApp Us
        </a>
        <span className="text-bark-300">·</span>
        <Link href="/contact" className="font-semibold text-caramel-700 hover:underline">
          Contact Page
        </Link>
      </div>
    </div>
  );
}
