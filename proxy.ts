import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/**
 * Next.js 16+: `middleware` was renamed to `proxy` (edge request guard for /admin).
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */
export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/login")) {
    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET || "dev-secret-min-32-chars-for-local",
      salt: "authjs.session-token",
    });
    if (token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!req.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (!ADMIN_EMAIL) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || "dev-secret-min-32-chars-for-local",
    salt: "authjs.session-token",
  });

  const email = (token?.email as string) ?? "";
  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
