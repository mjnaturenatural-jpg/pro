import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function guardAdmin(next?: string) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    redirect(next ? `/admin/login?next=${encodeURIComponent(next)}` : "/admin/login");
  }
  return session;
}
