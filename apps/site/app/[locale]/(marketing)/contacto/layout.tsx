// Layout wrapper for the contacto page (client component).
// Its sole purpose is to emit proper metadata + canonical/hreflang alternates
// so Search Console stops flagging the page as duplicate.
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return buildPageMetadata({
    locale,
    path: "/contacto",
    title: t("meta.title"),
    description: t("meta.desc"),
  });
}

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
