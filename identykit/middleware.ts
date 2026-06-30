import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/sign-in", "/sign-up", "/emergencia-publica", "/_next", "/favicon", "/icon", "/manifest"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas públicas
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Verificar sesión Clerk via cookie __session o __clerk_db_jwt
  const session = req.cookies.get("__session")?.value ||
                  req.cookies.get("__clerk_db_jwt")?.value;

  if (!session) {
    const signIn = new URL("/sign-in", req.url);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.webmanifest).*)"],
};
