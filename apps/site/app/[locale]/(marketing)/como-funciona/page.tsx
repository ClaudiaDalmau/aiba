import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, MessageCircle, CalendarCheck, BellRing, ShieldCheck, Star, Sparkles } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata, marketingBreadcrumbs, toJsonLdScript } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "howItWorks.meta" });
  return buildPageMetadata({ locale, path: "/como-funciona", title: t("title"), description: t("desc") });
}

const STEPS = [
  { icon: MessageCircle, emoji: "💬", key: "s1" },
  { icon: CalendarCheck, emoji: "📅", key: "s2" },
  { icon: BellRing, emoji: "🔔", key: "s3" },
  { icon: ShieldCheck, emoji: "💳", key: "s4" },
  { icon: Star, emoji: "⭐", key: "s5" },
];

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("howItWorks");

  // JSON-LD BreadcrumbList — helps Google build path snippets in SERPs.
  const crumbLabels: Record<string, { home: string; here: string }> = {
    es: { home: "Inicio", here: "Cómo funciona" },
    en: { home: "Home", here: "How it works" },
    fr: { home: "Accueil", here: "Comment ça marche" },
    de: { home: "Start", here: "So funktioniert es" },
    it: { home: "Home", here: "Come funziona" },
    "pt-BR": { home: "Início", here: "Como funciona" },
    ru: { home: "Главная", here: "Как это работает" },
    nl: { home: "Home", here: "Hoe het werkt" },
    ro: { home: "Acasă", here: "Cum funcționează" },
    pl: { home: "Strona główna", here: "Jak to działa" },
  };
  const cl = crumbLabels[locale] || crumbLabels.es;
  const breadcrumbLd = marketingBreadcrumbs({
    locale,
    path: "/como-funciona",
    homeName: cl.home,
    currentName: cl.here,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbLd) }}
      />
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 px-3 py-1 text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />{t("badge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-4">{t("title")}</h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">{t("subtitle")}</p>
        </div>
        <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-xl mb-16">
          <Image src="/samples/style_c_photo_ui_overlay.png" alt="" width={1344} height={768} className="w-full h-auto" />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 md:px-6 pb-24">
        <div className="space-y-14">
          {STEPS.map((s, i) => (
            <div key={s.key} className="relative">
              {i < STEPS.length - 1 && <div className="absolute left-6 top-16 bottom-[-56px] w-px bg-violet-200 dark:bg-violet-900/50" />}
              <div className="flex gap-4 md:gap-6">
                <div className="flex-shrink-0 h-12 w-12 md:h-14 md:w-14 rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 text-white flex items-center justify-center shadow-lg shadow-violet-600/20">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 pt-1">
                  <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
                    <span>{s.emoji}</span>{t(`${s.key}.title`)}
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">{t(`${s.key}.desc`)}</p>
                  <div className="rounded-lg bg-neutral-50 dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 p-4">
                    <p className="text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 font-semibold mb-2">{t("exampleLabel")}</p>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 italic leading-relaxed">{t(`${s.key}.example`)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 border-t border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-violet-600 to-violet-700 text-white">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("ctaTitle")}</h2>
          <p className="text-violet-100 text-lg mb-8">{t("ctaSubtitle")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-md bg-white hover:bg-neutral-100 text-violet-700 text-base font-semibold transition-colors shadow-lg">
              {t("ctaPrimary")}<ArrowRight className="h-4 w-4" />
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
