import { connectDB } from "@/lib/db";
import { Coupon, Product } from "@/models";
import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING } from "@/lib/constants";

export interface CartLineInput {
  productId: string;
  packSize: string;
  quantity: number;
}

export interface ResolvedItem {
  productId: string;
  name: string;
  image: string;
  packSize: string;
  sku: string;
  price: number;
  mrp: number;
  quantity: number;
  subtotal: number;
}

export interface PriceBreakdown {
  items: ResolvedItem[];
  subtotal: number;
  mrpTotal: number;
  itemDiscount: number;
  couponCode: string | null;
  couponDiscount: number;
  shipping: number;
  tax: number;
  total: number;
}

export async function resolveCart(items: CartLineInput[]): Promise<ResolvedItem[]> {
  await connectDB();
  const resolved: ResolvedItem[] = [];
  for (const line of items) {
    const product = await Product.findById(line.productId).lean();
    if (!product) throw new Error(`Product not found: ${line.productId}`);
    const pack = (product as unknown as { packSizes: { label: string; mrp: number; price: number; sku?: string }[] }).packSizes.find(
      (p) => p.label === line.packSize
    );
    if (!pack) throw new Error(`Pack size not available for ${product.name}`);
    const qty = Math.max(1, Math.min(50, line.quantity));
    resolved.push({
      productId: product._id.toString(),
      name: product.name,
      image: (product as unknown as { images: string[] }).images[0] || "",
      packSize: pack.label,
      sku: pack.sku || "",
      price: pack.price,
      mrp: pack.mrp,
      quantity: qty,
      subtotal: pack.price * qty,
    });
  }
  return resolved;
}

export async function computeCouponDiscount(
  code: string,
  subtotal: number,
  userId?: string
): Promise<{ valid: boolean; discount: number; error?: string }> {
  await connectDB();
  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() }).lean();
  if (!coupon) return { valid: false, discount: 0, error: "Invalid coupon code" };
  const c = coupon as unknown as {
    active: boolean; startsAt: Date; endsAt: Date; minOrder: number;
    type: "PERCENTAGE" | "FIXED"; value: number; maxDiscount: number | null;
    usageLimit: number | null; usedCount: number;
  };
  const now = new Date();
  if (!c.active) return { valid: false, discount: 0, error: "This coupon is inactive" };
  if (now < new Date(c.startsAt)) return { valid: false, discount: 0, error: "This coupon is not active yet" };
  if (now > new Date(c.endsAt)) return { valid: false, discount: 0, error: "This coupon has expired" };
  if (subtotal < c.minOrder)
    return { valid: false, discount: 0, error: `Minimum order of ₹${c.minOrder} required` };
  if (c.usageLimit != null && c.usedCount >= c.usageLimit)
    return { valid: false, discount: 0, error: "This coupon has reached its usage limit" };
  let discount = c.type === "PERCENTAGE" ? (subtotal * c.value) / 100 : c.value;
  if (c.maxDiscount != null) discount = Math.min(discount, c.maxDiscount);
  discount = Math.min(discount, subtotal);
  return { valid: true, discount: Math.round(discount * 100) / 100 };
}

export async function computeTotals(
  items: ResolvedItem[],
  couponCode?: string | null,
  userId?: string
): Promise<PriceBreakdown> {
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const mrpTotal = items.reduce((s, i) => s + i.mrp * i.quantity, 0);
  const itemDiscount = mrpTotal - subtotal;

  let couponDiscount = 0;
  let appliedCode: string | null = null;
  if (couponCode) {
    const result = await computeCouponDiscount(couponCode, subtotal, userId);
    if (result.valid) {
      couponDiscount = result.discount;
      appliedCode = couponCode.toUpperCase().trim();
    }
  }

  const netBeforeShipping = subtotal - couponDiscount;
  const shipping = netBeforeShipping >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const tax = 0;
  const total = Math.max(0, netBeforeShipping + shipping + tax);

  return {
    items,
    subtotal,
    mrpTotal,
    itemDiscount,
    couponCode: appliedCode,
    couponDiscount,
    shipping,
    tax,
    total: Math.round(total * 100) / 100,
  };
}
