import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";
import BusinessTypeCards, { type BusinessTypeCase } from "@/components/business-types/BusinessTypeCards";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "businessTypes.meta" });
  return buildPageMetadata({ locale, path: "/tipos-de-negocio", title: t("title"), description: t("desc") });
}

const CASE_KEYS = [
  { key: "health", emoji: "🩺" },
  { key: "beauty", emoji: "💅" },
  { key: "sports", emoji: "🏋️" },
  { key: "education", emoji: "🎓" },
  { key: "legal", emoji: "⚖️" },
  { key: "events", emoji: "🎉" },
  { key: "hospitality", emoji: "🏨" },
  { key: "pets", emoji: "🐾" },
  { key: "home", emoji: "🏠" },
];

export default async function BusinessTypesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("businessTypes");
  const tHome = await getTranslations("home.cases.case");

  // Build the case data server-side so client-side JS stays tiny + i18n stays SSR.
  const cases: BusinessTypeCase[] = CASE_KEYS.map((c) => {
    const benefits = ["b1", "b2", "b3", "b4"]
      .map((bk) => t(`cases.${c.key}.${bk}`))
      .filter((b) => b && b.length > 0 && !b.startsWith("businessTypes."));
    return {
      key: c.key,
      emoji: c.emoji,
      title: tHome(`${c.key}.title`),
      subtitle: t(`cases.${c.key}.subtitle`),
      benefits,
    };
  });

  // Modal + form copy — fully i18n via `businessTypes.form.*`.
  const tForm = await getTranslations("businessTypes.form");
  const labels = {
    signupTitle:      tForm("signupTitle"),
    signupSubtitle:   tForm("signupSubtitle"),
    signupNamePh:     tForm("signupNamePh"),
    signupBusinessPh: tForm("signupBusinessPh"),
    signupEmailPh:    tForm("signupEmailPh"),
    signupPhonePh:    tForm("signupPhonePh"),
    signupWebsitePh:  tForm("signupWebsitePh"),
    signupCta:        tForm("signupCta"),
    signupSuccess:    tForm("signupSuccess"),
    accessTitle:      tForm("accessTitle"),
    accessSubtitle:   tForm("accessSubtitle"),
    accessProfPh:     tForm("accessProfPh"),
    accessPhonePh:    tForm("accessPhonePh"),
    accessEmailPh:    tForm("accessEmailPh"),
    accessWebsitePh:  tForm("accessWebsitePh"),
    accessPortalPh:   tForm("accessPortalPh"),
    accessCta:        tForm("accessCta"),
    accessSuccess:    tForm("accessSuccess"),
    close:            tForm("close"),
    fieldRequired:    tForm("fieldRequired"),
    emailInvalid:     tForm("emailInvalid"),
    urlHint:          tForm("urlHint"),
    accessKicker:     tForm("accessKicker"),
    portalsLabel:     tForm("portalsLabel"),
    addPortal:        tForm("addPortal"),
    accessSuccessTitle: tForm("accessSuccessTitle"),
    removeAriaLabel:  tForm("removeAriaLabel"),
  };

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-12">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 px-3 py-1 text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            {t("badge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-4">
            {t("title")}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">{t("subtitle")}</p>
        </div>

        <BusinessTypeCards cases={cases} locale={locale} labels={labels} />
      </section>

      <section className="py-20 border-t border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-violet-600 to-violet-700 text-white mt-12">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("ctaTitle")}</h2>
          <p className="text-violet-100 text-lg mb-8">{t("ctaSubtitle")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-md bg-white hover:bg-neutral-100 text-violet-700 text-base font-semibold transition-colors shadow-lg">
              {t("ctaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contacto" className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-md bg-violet-800/50 hover:bg-violet-800/70 text-white text-base font-semibold transition-colors ring-1 ring-white/30">
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
