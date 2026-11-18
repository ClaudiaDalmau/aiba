import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { ArrowRight, HelpCircle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata, faqPageJsonLd, breadcrumbsJsonLd, toJsonLdScript } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq.meta" });
  return buildPageMetadata({ locale, path: "/faq", title: t("title"), description: t("desc") });
}

const NUMS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faq");
  const tHeader = await getTranslations({ locale, namespace: "header" });

  // JSON-LD: FAQPage + BreadcrumbList (rich results on Google)
  const faqData = faqPageJsonLd(
    NUMS.map((n) => ({ question: t(`items.q${n}`), answer: t(`items.a${n}`) })),
  );
  const breadcrumbs = breadcrumbsJsonLd([
    { name: tHeader("home") || "Inicio", url: `/${locale}` },
    { name: t("badge"), url: `/${locale}/faq` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(faqData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbs) }}
      />
      <section className="max-w-3xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-16">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 px-3 py-1 text-xs font-medium mb-6">
            <HelpCircle className="h-3.5 w-3.5" />
            {t("badge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-4">
            {t("title")}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            {t("subtitleStart")}
            <a href="mailto:info@aibookingassistant.app" className="text-violet-700 dark:text-violet-300 hover:underline font-medium">
              info@aibookingassistant.app
            </a>
            {t("subtitleEnd")}
          </p>
        </div>

        <div className="space-y-4">
          {NUMS.map((n) => (
            <details key={n} className="group rounded-xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 hover:ring-violet-300 dark:hover:ring-violet-700 transition-colors">
              <summary className="cursor-pointer p-5 flex items-start justify-between gap-4 list-none">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
                  {t(`items.q${n}`)}
                </span>
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 flex items-center justify-center text-lg font-bold group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="px-5 pb-5">
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{t(`items.a${n}`)}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="py-16 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">{t("ctaTitle")}</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">{t("ctaSubtitle")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contacto" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-base font-semibold transition-colors shadow-lg shadow-violet-600/20">
              {t("ctaContact")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-base font-semibold transition-colors ring-1 ring-neutral-200 dark:ring-neutral-700">
              {t("ctaTry")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
