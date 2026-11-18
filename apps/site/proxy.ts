import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Web pública de AIBA: solo páginas de marketing con idioma en la URL (/es, /en…).
 * Entrar, registrarse y el panel viven en la app de AIBA (NEXT_PUBLIC_APP_URL).
 */
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://aiba-pied.vercel.app").replace(/\/$/, "");
const intlMiddleware = createIntlMiddleware(routing);

// Rutas de la app antigua que ahora se resuelven en la app de AIBA
const APP_REDIRECTS: Record<string, string> = {
  login: "/login",
  register: "/signup",
  signup: "/signup",
  dashboard: "/app",
  onboarding: "/app/onboarding",
};

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const parts = pathname.split("/").filter(Boolean);
  const isLocale = parts[0] && routing.locales.includes(parts[0] as (typeof routing.locales)[number]);
  const appPart = isLocale ? parts[1] : parts[0];
  if (appPart && APP_REDIRECTS[appPart]) {
    return NextResponse.redirect(`${APP_URL}${APP_REDIRECTS[appPart]}`);
  }
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) return NextResponse.next();
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|opengraph-image|twitter-image|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|svg|webp|ico|gif|txt|xml)).*)",
  ],
};
