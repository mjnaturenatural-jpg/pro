import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const authMiddleware = withAuth(
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

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  // next-auth redirects to its own "problem with the server configuration" page
  // when the signing secret is missing. Catch it first and show the sign-in
  // page with an actionable message instead — auth still fails closed.
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret && req.nextUrl.pathname !== "/admin/login") {
    const url = new URL("/admin/login", req.url);
    url.searchParams.set("error", "server-config");
    return NextResponse.redirect(url);
  }
  return authMiddleware(req as NextRequestWithAuth, event);
}

export const config = {
  matcher: ["/admin/:path*"],
};
