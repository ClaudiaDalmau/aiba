import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { buildAlternates, SITE_NAME, SITE_URL, TWITTER_HANDLE } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Locale-level metadata defaults.
 *
 * Emits `<link rel="canonical">` and the full set of `<link rel="alternate" hreflang="…">`
 * for the current URL. Individual pages (home, /precios, …) can override this by
 * returning their own `alternates` in `generateMetadata`; if they don't, they inherit
 * the locale root canonical which still fixes the Search Console duplicate warning.
 *
 * Also seeds sensible openGraph + Twitter defaults so social shares always have
 * a rich preview even for pages that don't set them explicitly.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const alternates = buildAlternates(locale, "");

  // Reuse the "hero" translations if available; fall back to sensible defaults.
  let title = SITE_NAME;
  let description =
    "Reservas automáticas con IA + Telegram para profesionales independientes.";
  try {
    const t = await getTranslations({ locale, namespace: "meta" });
    title = t("home.title");
    description = t("home.description");
  } catch { /* fall back to defaults if the key doesn't exist yet */ }

  // Search engine verification codes.
  // These are also declared via DNS TXT / Bing Webmaster Tools, but the
  // meta tags provide a redundant verification path in case DNS TTL is slow
  // or the DNS TXT record is accidentally removed by the registrar.
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
  const yandexVerification = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION;

  const verification: NonNullable<Metadata["verification"]> = {};
  if (googleVerification) verification.google = googleVerification;
  if (yandexVerification) verification.yandex = yandexVerification;
  // Bing uses `msvalidate.01` — Next.js exposes it via `verification.other`.
  if (bingVerification) {
    verification.other = { "msvalidate.01": bingVerification };
  }

  return {
    metadataBase: new URL(SITE_URL),
    // NOTE (iter32): title is a plain string here (no template).
    //   Pages that set their own title do so via `title.absolute`
    //   (see `buildPageMetadata` in lib/seo.ts). This prevents the
    //   "Precios · AI Booking · AI Booking" duplication that Google
    //   was picking up in the SERP snippet.
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: alternates.canonical,
      siteName: SITE_NAME,
      locale,
      type: "website",
      images: [{ url: `${SITE_URL}/opengraph-image` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: `@${TWITTER_HANDLE}`,
      images: [`${SITE_URL}/opengraph-image`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    ...(Object.keys(verification).length > 0 ? { verification } : {}),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      {children}
    </NextIntlClientProvider>
  );
}
