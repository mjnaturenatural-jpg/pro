import { User } from "@/models";

export async function isAdminOrderOwned(
  order: unknown,
  email: string,
  role?: string
): Promise<boolean> {
  if (role === "ADMIN") return true;
  const o = order as {
    customer?: { email?: string };
    user?: { toString(): string } | null;
  };
  if (o.customer?.email && o.customer.email.toLowerCase() === email.toLowerCase()) return true;
  if (!o.user) return false;
  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  if (!user) return false;
  const uid = (user as unknown as { _id: { toString(): string } })._id.toString();
  return o.user.toString() === uid;
}
