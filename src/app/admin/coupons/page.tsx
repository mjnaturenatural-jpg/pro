import { guardAdmin } from "@/lib/admin-guard";
import { connectDB } from "@/lib/db";
import { Coupon } from "@/models";
import { CouponManager } from "@/components/admin/CouponManager";

export const metadata = { title: "Coupons" };
export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  await guardAdmin("/admin/coupons");
  await connectDB();
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  return <CouponManager coupons={JSON.parse(JSON.stringify(coupons))} />;
}
