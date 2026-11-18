import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://aibookingassistant.app").replace(/\/$/, "");

/**
 * robots.txt
 *
 * - Allow marketing pages under all locales.
 * - Disallow authenticated dashboard, auth flows, API routes and internal
 *   Next.js paths.
 * - Reference the multi-language sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/admin",
          "/admin/",
          "/clients",
          "/calendar",
          "/settings",
          "/onboarding",
          "/verificacion",
          "/login",
          "/register",
          "/logout",
          "/style-picker",
          "/_next/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
