import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPageView } from "@/components/legal/legal-page-view";
import { getLegalContent } from "@/lib/legal-content";
import { routing } from "@/i18n/routing";
import { buildPageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const content = getLegalContent(locale).privacidad;
  return buildPageMetadata({
    locale,
    path: "/legal/privacidad",
    title: content.metaTitle,
    description: content.metaDescription,
  });
}

export default async function PrivacidadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = getLegalContent(locale);
  return (
    <LegalPageView
      page={l.privacidad}
      labels={l.labels}
      slug="privacidad"
      locale={locale}
    />
  );
}
