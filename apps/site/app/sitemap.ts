import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { listCanonicalSlugs, listPosts } from "@/lib/blog";

/**
 * Multi-language sitemap with hreflang alternates.
 *
 * - Emits one entry per canonical URL (defaultLocale = es).
 * - Each entry includes `alternates.languages` with all 6 locales +
 *   `x-default` → the Spanish version, per Google's hreflang guidelines.
 * - The dashboard, auth pages and API routes are intentionally excluded
 *   (they are Disallowed in robots.txt as well).
 */

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://aibookingassistant.app").replace(/\/$/, "");

// Marketing routes served under /[locale]/(marketing)/*
// Path "" corresponds to the locale root (home).
const MARKETING_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "",                    priority: 1.0, changeFrequency: "weekly" },
  { path: "/como-funciona",      priority: 0.9, changeFrequency: "monthly" },
  { path: "/precios",            priority: 0.9, changeFrequency: "monthly" },
  { path: "/tipos-de-negocio",   priority: 0.8, changeFrequency: "monthly" },
  { path: "/faq",                priority: 0.7, changeFrequency: "monthly" },
  { path: "/nosotros",           priority: 0.6, changeFrequency: "yearly" },
  { path: "/contacto",           priority: 0.6, changeFrequency: "yearly" },
  { path: "/acceso-verificado",  priority: 0.4, changeFrequency: "yearly" },
  { path: "/legal/aviso-legal",  priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/privacidad",   priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/terminos",     priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/cookies",      priority: 0.3, changeFrequency: "yearly" },
  { path: "/blog",               priority: 0.8, changeFrequency: "weekly" },
];

// Map internal locale codes to the values Google expects in hreflang.
// next-intl uses "pt-BR"; we keep it as-is (Google accepts both "pt-BR" and "pt-br").
function hreflangFor(locale: string): string {
  return locale;
}

function buildUrl(locale: string, path: string): string {
  return `${SITE_URL}/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const route of MARKETING_ROUTES) {
    // Build the alternates.languages map: every locale + x-default.
    const languages: Record<string, string> = {};
    for (const l of routing.locales) {
      languages[hreflangFor(l)] = buildUrl(l, route.path);
    }
    languages["x-default"] = buildUrl(routing.defaultLocale, route.path);

    // Emit one entry per locale so search engines can index each localized URL,
    // but every entry shares the same `alternates.languages` block (bidirectional
    // linking is required by Google for hreflang to be honored).
    for (const l of routing.locales) {
      entries.push({
        url: buildUrl(l, route.path),
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages },
      });
    }
  }

  // Blog posts: one entry per (locale, slug). Only slugs present in the
  // canonical Spanish library are considered. Hreflang points to the locales
  // where the post is actually published (fallbacks read from ES).
  for (const slug of listCanonicalSlugs()) {
    const languages: Record<string, string> = {};
    // Include every locale — for missing translations we fall back to ES
    // at render time, so all URLs are valid indexable pages.
    for (const l of routing.locales) {
      languages[hreflangFor(l)] = buildUrl(l, `/blog/${slug}`);
    }
    languages["x-default"] = buildUrl(routing.defaultLocale, `/blog/${slug}`);

    // Use the ES post metadata as the lastModified source of truth.
    const canonicalPost = listPosts(routing.defaultLocale).find((p) => p.slug === slug);
    const lastMod = canonicalPost ? new Date(canonicalPost.date) : now;

    for (const l of routing.locales) {
      entries.push({
        url: buildUrl(l, `/blog/${slug}`),
        lastModified: lastMod,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages },
      });
    }
  }

  return entries;
}
