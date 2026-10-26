import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "operra_session";
const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || "operra-super-secret-jwt-key-versaly-2026-production-ready"
);

const PUBLIC_EXACT_PATHS = [
  "/",
  "/products",
  "/distribution",
  "/about",
  "/contact",
  "/login",
  "/register",
];

const PUBLIC_PREFIX_PATHS = [
  "/api/auth",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files & Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublicPath =
    PUBLIC_EXACT_PATHS.includes(pathname) ||
    PUBLIC_PREFIX_PATHS.some((path) => pathname.startsWith(path));

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET_KEY);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated && !isPublicPath) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized. Authentication session required." },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
