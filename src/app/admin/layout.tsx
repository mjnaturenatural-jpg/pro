import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  // /admin/login is nested under this layout, so allow it through
  if (!session?.user || role !== "ADMIN") {
    // We can't know the path here; child pages handle redirect. But to keep the
    // shell consistent, render children (login page) inside a minimal wrapper.
    return (
      <div className="min-h-screen bg-ivory-50">
        <AdminLoginShell>{children}</AdminLoginShell>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-50">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminTopbar name={session.user.name || "Admin"} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function AdminLoginShell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-ivory-50">{children}</div>;
}
