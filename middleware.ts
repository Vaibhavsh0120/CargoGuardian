import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const protectedPrefixes = [
  "/dashboard",
  "/fleet",
  "/trains",
  "/map",
  "/analytics",
  "/alerts",
  "/history",
  "/settings"
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    if (!hasSessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/fleet/:path*", "/trains/:path*", "/map/:path*", "/analytics/:path*", "/alerts/:path*", "/history/:path*", "/settings/:path*"]
};
