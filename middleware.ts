// middleware.ts
import { NextRequest, NextResponse } from "next/server";

// Public (herkesin erişebileceği) rotalar
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/api/setToken",
  "/api/clearToken",
  // ... gerekirse ek public route
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public yollara zaten izin ver
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Cookie kontrol
  const token = request.cookies.get("token")?.value;
  if (!token) {
    // Token yok -> login'e yönlendir
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Tüm yollar + özel matcher
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
