import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // Protect all /admin routes except the login page
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
      if (role !== "ADMIN") {
        const url = new URL("/admin/login", req.url);
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
    pages: { signIn: "/admin/login" },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
