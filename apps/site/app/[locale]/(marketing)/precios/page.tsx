import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata, pricingProductJsonLd, marketingBreadcrumbs, toJsonLdScript } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing.meta" });
  return buildPageMetadata({
    locale,
    path: "/precios",
    title: t("title"),
    description: t("desc"),
  });
}

type PlanKey = "basic" | "pro" | "premium";
const PLAN_KEYS: PlanKey[] = ["basic", "pro", "premium"];
const PRICES: Record<PlanKey, number> = { basic: 49, pro: 99, premium: 299 };
const HIGHLIGHT_KEY: PlanKey = "pro";
const SITE_NAME_LABEL = "AIBA";

// Feature-row keys used to index into pricing.rows.{key}
const ROW_KEYS = [
  "bookings", "bot", "agenda", "verify", "deposits", "commission",
  "reminders", "push", "daily", "analytics", "extras", "support",
] as const;

// Boolean-only rows: values are shown as ✓/✗ per plan (no per-plan text).
const BOOL_ROWS: Record<string, Record<PlanKey, boolean>> = {
  bot:      { basic: true,  pro: true,  premium: true },
  agenda:   { basic: true,  pro: true,  premium: true },
  verify:   { basic: true,  pro: true,  premium: true },
  deposits: { basic: false, pro: true,  premium: true },
  daily:    { basic: false, pro: false, premium: true },
};

const FAQ_KEYS = ["1", "2", "3", "4"] as const;

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="h-5 w-5 text-violet-600 dark:text-violet-400 mx-auto" />;
  if (v === false) return <X className="h-5 w-5 text-neutral-300 dark:text-neutral-700 mx-auto" />;
  return <span className="text-sm text-neutral-700 dark:text-neutral-300">{v}</span>;
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");

  // JSON-LD: BreadcrumbList (Inicio → Precios) + Product with 3 Offers.
  const crumbLabels: Record<string, { home: string; here: string }> = {
    es: { home: "Inicio", here: "Precios" },
    en: { home: "Home", here: "Pricing" },
    fr: { home: "Accueil", here: "Tarifs" },
    de: { home: "Start", here: "Preise" },
    it: { home: "Home", here: "Prezzi" },
    "pt-BR": { home: "Início", here: "Preços" },
    ru: { home: "Главная", here: "Цены" },
  };
  const cl = crumbLabels[locale] || crumbLabels.es;
  const breadcrumbLd = marketingBreadcrumbs({
    locale,
    path: "/precios",
    homeName: cl.home,
    currentName: cl.here,
  });
  const productLd = pricingProductJsonLd({
    locale,
    plans: PLAN_KEYS.map((k) => ({
      name: `${SITE_NAME_LABEL} ${k[0].toUpperCase()}${k.slice(1)}`,
      price: PRICES[k],
      description: t(`plans.${k}.tagline`),
    })),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(productLd) }}
      />
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 px-3 py-1 text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            {t("badge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-4">
            {t("title")}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">{t("subtitle")}</p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PLAN_KEYS.map((k) => {
            const highlight = k === HIGHLIGHT_KEY;
            return (
              <div
                key={k}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  highlight
                    ? "bg-gradient-to-br from-violet-600 to-violet-700 text-white shadow-xl shadow-violet-600/20 ring-1 ring-violet-500"
                    : "bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800"
                }`}
              >
                {highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-neutral-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {t("highlightBadge")}
                  </span>
                )}
                <h3 className={`text-2xl font-bold mb-2 ${highlight ? "text-white" : "text-neutral-900 dark:text-neutral-100"}`}>
                  {t(`plans.${k}.name`)}
                </h3>
                <p className={`text-sm mb-6 ${highlight ? "text-violet-100" : "text-neutral-600 dark:text-neutral-400"}`}>
                  {t(`plans.${k}.tagline`)}
                </p>
                <div className="mb-6">
                  <span className={`text-5xl font-bold ${highlight ? "text-white" : "text-neutral-900 dark:text-neutral-100"}`}>{PRICES[k]}€</span>
                  <span className={`text-sm ml-1 ${highlight ? "text-violet-200" : "text-neutral-500"}`}>{t("perMonth")}</span>
                </div>
                <Link
                  href="/register"
                  className={`inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-md text-sm font-semibold transition-colors mt-auto ${
                    highlight
                      ? "bg-white hover:bg-neutral-100 text-violet-700"
                      : "bg-violet-600 hover:bg-violet-700 text-white"
                  }`}
                >
                  {t(`plans.${k}.cta`)}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className={`text-xs text-center mt-3 ${highlight ? "text-violet-200" : "text-neutral-500"}`}>
                  {t("trialNote")}
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-center text-neutral-500 mb-14">{t("smallPrint")}</p>

        {/* Comparison table */}
        <div className="rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-950">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-neutral-900 dark:text-neutral-100">
                    {t("tableTitle")}
                  </th>
                  {PLAN_KEYS.map((k) => (
                    <th key={k} className="text-center px-6 py-4 font-semibold text-neutral-900 dark:text-neutral-100 min-w-[120px]">
                      {t(`plans.${k}.name`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {ROW_KEYS.map((rk) => (
                  <tr key={rk}>
                    <td className="px-6 py-4 text-neutral-700 dark:text-neutral-300">{t(`rows.${rk}.label`)}</td>
                    {PLAN_KEYS.map((pk) => {
                      const boolMap = BOOL_ROWS[rk];
                      const value: string | boolean = boolMap
                        ? boolMap[pk]
                        : t(`rows.${rk}.${pk}` as never);
                      return (
                        <td key={pk} className="px-6 py-4 text-center">
                          <Cell v={value} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 mt-16">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 text-center mb-10">
            {t("faq.title")}
          </h2>
          <div className="space-y-6">
            {FAQ_KEYS.map((n) => (
              <details key={n} className="group border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <summary className="cursor-pointer font-semibold text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
                  {t(`faq.q${n}`)}
                  <span className="text-violet-600 dark:text-violet-400 text-xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-neutral-600 dark:text-neutral-400 mt-3 leading-relaxed">{t(`faq.a${n}`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
