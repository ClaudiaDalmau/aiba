// SEO helpers for canonical + hreflang alternates + Open Graph + JSON-LD.
//
// Google Search Console error we want to fix:
//   "Duplicada: el usuario no ha indicado ninguna versión canónica"
//
// The fix requires TWO things on every localized page:
//   1. <link rel="canonical" href="…/{locale}{path}">
//   2. <link rel="alternate" hreflang="{locale}" href="…"> for every locale + x-default
//
// Next.js emits these automatically when you return `alternates` in `generateMetadata`.
// This helper centralises the URL building so a single import per page is enough.
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://aibookingassistant.app"
).replace(/\/$/, "");

export const SITE_NAME = "AIBA";

/** Twitter handle used for Twitter Card meta tags (no @ prefix). */
export const TWITTER_HANDLE = "aibookingapp";

/**
 * Build alternates object for a marketing page.
 *
 * @param locale  Current locale for this rendering (used as canonical).
 * @param path    Localized path *without* the locale prefix. Use "" for the home page.
 *                Examples: "", "/precios", "/legal/privacidad", "/tipos-de-negocio".
 */
export function buildAlternates(locale: string, path: string = "") {
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `${SITE_URL}/${l}${cleanPath}`;
  }
  // Google recommends the default locale be pointed to by x-default.
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}${cleanPath}`;

  return {
    canonical: `${SITE_URL}/${locale}${cleanPath}`,
    languages,
  };
}

/**
 * Build a full Metadata blob including canonical, alternates, openGraph and
 * Twitter card. Prefer this over `buildAlternates` for pages that want to
 * customise their title/description without repeating boilerplate.
 *
 * IMPORTANT (iter32):
 *   - Uses `title.absolute` to prevent the root layout's title template
 *     from appending "· AIBA" on top of translations that
 *     already include the brand suffix (avoids "Precios · AI Booking · AI Booking").
 *   - Overrides `openGraph.url` so it matches the locale-scoped canonical
 *     (fixes the case where the parent layout leaks its home-page og:url
 *     into every sub-page).
 */
export function buildPageMetadata(opts: {
  locale: string;
  path: string;
  title: string;
  description: string;
  /** Optional OG image path (relative). Defaults to /opengraph-image. */
  ogImage?: string;
}): Metadata {
  const alternates = buildAlternates(opts.locale, opts.path);
  const ogImageUrl = opts.ogImage
    ? (opts.ogImage.startsWith("http") ? opts.ogImage : `${SITE_URL}${opts.ogImage}`)
    : `${SITE_URL}/opengraph-image`;
  return {
    title: { absolute: opts.title },
    description: opts.description,
    alternates,
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: alternates.canonical,
      siteName: SITE_NAME,
      locale: opts.locale,
      type: "website",
      images: [{ url: ogImageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      site: `@${TWITTER_HANDLE}`,
      images: [ogImageUrl],
    },
  };
}

// ---------------------------------------------------------------------------
// JSON-LD structured data — see https://schema.org
// ---------------------------------------------------------------------------
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/opengraph-image`,
    sameAs: [
      "https://twitter.com/aibookingapp",
      "https://instagram.com/aibookingassistant",
    ],
    contactPoint: [{
      "@type": "ContactPoint",
      email: "hola@aibookingassistant.app",
      contactType: "customer support",
      availableLanguage: ["Spanish", "English", "Portuguese", "French", "German", "Italian", "Russian"],
    }],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: ["es", "en", "pt-BR", "fr", "de", "it", "ru", "nl", "ro", "pl"],
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "iOS, Android, Web",
    description:
      "AI booking SaaS on WhatsApp & Telegram for independent professionals: web dashboard, mobile app, 24/7 chatbot, deposits, reminders and reviews.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      description: "14-day free trial on every plan: Basic, Pro and Premium",
    },
    // NOTE (iter31 follow-up): removed the hardcoded aggregateRating.
    // Google penalises fake ratings and issues a manual action if it detects
    // rating data that doesn't correspond to real user reviews on the site.
    // Re-enable this ONCE we have ≥5 real reviews from public users and can
    // seed it from `db.pro_reviews` server-side.
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/**
 * FAQPage schema.org — Google renders these as expandable Q&A snippets
 * ("People also ask") directly in search results.
 */
export function faqPageJsonLd(entries: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: e.answer,
      },
    })),
  };
}

/**
 * Article schema.org — blog posts. Renders with author, published date,
 * hero image, and can qualify for Google Top Stories & News tabs.
 */
export function articleJsonLd(opts: {
  title: string;
  description: string;
  slug: string;
  locale: string;
  publishedAt: string;   // ISO 8601
  updatedAt?: string;    // ISO 8601
  author?: string;
  heroImage?: string;    // absolute URL preferred
}) {
  const url = `${SITE_URL}/${opts.locale}/blog/${opts.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: opts.title,
    description: opts.description,
    image: opts.heroImage || `${SITE_URL}/opengraph-image`,
    author: {
      "@type": "Organization",
      name: opts.author || SITE_NAME,
      url: SITE_URL,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
    datePublished: opts.publishedAt,
    dateModified: opts.updatedAt || opts.publishedAt,
    mainEntityOfPage: url,
    inLanguage: opts.locale,
  };
}

/**
 * BreadcrumbList schema.org — Google shows a path (Home > Blog > Post)
 * under the title instead of the raw URL.
 *
 * @param items ordered from root to leaf, e.g.
 *   [{ name: "Home", url: "/es" }, { name: "Blog", url: "/es/blog" }, ...]
 */
export function breadcrumbsJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `${SITE_URL}${it.url}`,
    })),
  };
}

/**
 * Helper: build a 2-level breadcrumb (Home → Current page) for a marketing
 * page. Adds the locale prefix automatically.
 */
export function marketingBreadcrumbs(opts: {
  locale: string;
  path: string;       // e.g. "/precios"
  currentName: string; // e.g. "Precios"
  homeName?: string;   // defaults to "Inicio"
}) {
  return breadcrumbsJsonLd([
    { name: opts.homeName || "Inicio", url: `/${opts.locale}` },
    { name: opts.currentName, url: `/${opts.locale}${opts.path.startsWith("/") ? opts.path : `/${opts.path}`}` },
  ]);
}

/**
 * Product/Offer schema.org — used for the pricing page.
 * Each plan is emitted as an Offer under a single Product node,
 * which lets Google render pricing snippets directly in search.
 */
export function pricingProductJsonLd(opts: {
  locale: string;
  plans: { name: string; price: number; currency?: string; description?: string; url?: string }[];
}) {
  const canonicalUrl = `${SITE_URL}/${opts.locale}/precios`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonicalUrl}#product`,
    name: `${SITE_NAME} — AI booking SaaS`,
    description:
      "Flexible plans from €39/month for AI-powered automatic bookings. Basic, Pro and Premium.",
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: opts.plans.map((p) => ({
      "@type": "Offer",
      name: p.name,
      price: String(p.price),
      priceCurrency: p.currency || "EUR",
      description: p.description,
      url: p.url || canonicalUrl,
      availability: "https://schema.org/InStock",
      priceValidUntil: "2026-12-31",
    })),
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

/**
 * Turn any JSON-LD object into a `<script type="application/ld+json">` string
 * ready to inject via `dangerouslySetInnerHTML`.
 */
export function toJsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
