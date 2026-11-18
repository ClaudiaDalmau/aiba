import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight, Bot, Calendar, CreditCard, Star, BarChart3,
  MessageCircle, CheckCircle2, Sparkles, Lock,
} from "lucide-react";
import { RedUmbrellaIcon } from "@/components/icons/red-umbrella-icon";
import TestimonialsSection from "@/components/landing/testimonials-section";
import ComparisonSection from "@/components/landing/comparison-section";
import FaqInlineSection from "@/components/landing/faq-inline-section";
import WaitlistSection from "@/components/landing/waitlist-section";
import SuccessMetricsSection from "@/components/landing/success-metrics-section";
import LiveDemoBot from "@/components/landing/live-demo-bot";
import HeroMedia from "@/components/landing/hero-media";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home.hero" });
  return buildPageMetadata({
    locale,
    path: "",
    title: `AIBA · ${t("titleHighlight")}`,
    description: t("subtitle"),
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const CASE_KEYS = [
    { emoji: "🩺", key: "health" },
    { emoji: "💅", key: "beauty" },
    { emoji: "🏋️", key: "sports" },
    { emoji: "🎓", key: "education" },
    { emoji: "⚖️", key: "legal" },
    { emoji: "🎉", key: "events" },
    { emoji: "🏨", key: "hospitality" },
    { emoji: "🐾", key: "pets" },
    { emoji: "🏠", key: "home" },
  ];

  const AUTOPILOT_PILLARS = [
    { emoji: "🌙", tKey: "pillar1" },
    { emoji: "🏖️", tKey: "pillar2" },
    { emoji: "⏳", tKey: "pillar3" },
  ];

  const PROCESS_STEPS = [
    { icon: MessageCircle, tKey: "step1" },
    { icon: Calendar, tKey: "step2" },
    { icon: Bot, tKey: "step3" },
    { icon: CreditCard, tKey: "step4" },
  ];

  const FEATURES = [
    { icon: Bot, tKey: "ai" },
    { icon: CreditCard, tKey: "payments" },
    { icon: BarChart3, tKey: "dashboard" },
    { icon: Star, tKey: "ratings" },
    { icon: Calendar, tKey: "agenda" },
    { icon: Lock, tKey: "privacy" },
  ];

  return (
    <>
      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-12">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-stretch">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 px-3 py-1 text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              {t("home.hero.badge")}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-6 leading-[1.05]">
              {t("home.hero.titleStart")}
              <span className="text-violet-600 dark:text-violet-400">{t("home.hero.titleHighlight")}</span>
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
              {t("home.hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-base font-semibold transition-colors shadow-lg shadow-violet-600/20"
              >
                {t("home.hero.ctaPrimary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/como-funciona"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-base font-semibold transition-colors ring-1 ring-neutral-200 dark:ring-neutral-700"
              >
                {t("home.hero.ctaSecondary")}
              </Link>
            </div>

            {/* Stats bar */}
            <div className="mt-10 grid grid-cols-3 gap-4 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t("home.stats.attention247Number")}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t("home.stats.attention247Label")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t("home.stats.timeNumber")}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t("home.stats.timeLabel")}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t("home.stats.secureNumber")}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t("home.stats.secureLabel")}</p>
              </div>
            </div>
          </div>

          <div className="relative flex items-center">
            <div className="w-full aspect-[16/10] md:aspect-auto md:h-full rounded-2xl overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-xl bg-[#F5F1EA] dark:bg-neutral-900 relative">
              <HeroMedia
                imageSrc="/samples/hero_light_pro.jpg"
                imageAlt="AIBA — gestión de citas con IA"
                videoSrc={process.env.NEXT_PUBLIC_HERO_VIDEO_URL || undefined}
                videoPoster="/samples/hero_light_pro.jpg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Iter67 — Success metrics + real cases */}
      <SuccessMetricsSection />

      {/* Iter67 — Live interactive demo bot */}
      <section className="py-20 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 font-semibold">
                Prueba en vivo
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">
                Chatea con la IA como si fueras tu cliente
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 mt-4 text-lg">
                Escribe cualquier cosa y verás cómo la asistente entiende el
                servicio, sugiere huecos y cierra la reserva. Sin instalar
                nada, sin apuntarte a la lista de espera.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                  <span>Entiende variaciones ("un cortecito", "tinte completo", "manicura y pedicura")</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                  <span>Propone huecos según tu horario real</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                  <span>Cobra el anticipo y envía recordatorios automáticos</span>
                </li>
              </ul>
            </div>
            <LiveDemoBot />
          </div>
        </div>
      </section>

      {/* AUTOPILOT */}
      <section className="relative overflow-hidden py-20 md:py-28 border-t border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-violet-50 via-white to-neutral-50 dark:from-violet-950/20 dark:via-neutral-950 dark:to-neutral-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(124,58,237,0.08),transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 font-semibold mb-3">
              {t("home.autopilot.label")}
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-6 leading-tight">
              {t("home.autopilot.titleStart")}
              <span className="text-violet-600 dark:text-violet-400">{t("home.autopilot.titleHighlight")}</span>
            </h2>
            <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t("home.autopilot.subtitle")}{" "}
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {t("home.autopilot.emphasis")}
              </span>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {AUTOPILOT_PILLARS.map((p) => (
              <div
                key={p.tKey}
                className="p-6 rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 hover:ring-violet-300 dark:hover:ring-violet-700 transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className="text-5xl mb-4">{p.emoji}</div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                  {t(`home.autopilot.${p.tKey}Title`)}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {t(`home.autopilot.${p.tKey}Desc`)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 max-w-3xl mx-auto text-center">
            <blockquote className="text-2xl md:text-3xl font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed italic">
              «{t("home.autopilot.quoteStart")}
              <span className="text-violet-600 dark:text-violet-400 not-italic font-bold">
                {t("home.autopilot.quoteHighlight")}
              </span>»
            </blockquote>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="py-20 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 font-semibold mb-3">
              {t("home.process.label")}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-4">
              {t("home.process.title")}
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-600/20">
                  <s.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 mb-2">
                  {i + 1}
                </p>
                <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                  {t(`home.process.${s.tKey}Title`)}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {t(`home.process.${s.tKey}Desc`)}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/como-funciona" className="inline-flex items-center gap-2 text-violet-700 dark:text-violet-300 hover:text-violet-900 dark:hover:text-violet-100 font-semibold">
              {t("home.process.seeFullProcess")} →
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 font-semibold mb-3">
              {t("home.features.label")}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {t("home.features.title")}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.tKey} className="p-6 rounded-xl bg-neutral-50 dark:bg-neutral-950 ring-1 ring-neutral-200 dark:ring-neutral-800">
                <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  {t(`home.features.${f.tKey}Title`)}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {t(`home.features.${f.tKey}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CASES PREVIEW */}
      <section id="cases" className="py-20 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 font-semibold mb-3">
              {t("home.cases.label")}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-4">
              {t("home.cases.title")}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              {t("home.cases.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {CASE_KEYS.map((c, i, arr) => (
              <div
                key={c.key}
                className={`p-6 rounded-xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 ${
                  i === arr.length - 1 ? "md:col-span-3 md:flex md:items-center md:gap-6" : ""
                }`}
              >
                <div className="text-3xl mb-3 md:mb-0">
                  {c.key === "other" ? (
                    <RedUmbrellaIcon size={36} />
                  ) : (
                    c.emoji
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    {t(`home.cases.case.${c.key}.title`)}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {t(`home.cases.case.${c.key}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/tipos-de-negocio" className="inline-flex items-center gap-2 text-violet-700 dark:text-violet-300 hover:text-violet-900 dark:hover:text-violet-100 font-semibold">
              {t("home.cases.seeAll")} →
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS — Fase 2 */}
      <TestimonialsSection />

      {/* PRICING PREVIEW */}
      <section className="py-20 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 font-semibold mb-3">
              {t("home.pricingPreview.label")}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-4">
              {t("home.pricingPreview.title")}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              {t("home.pricingPreview.subtitle")}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {(["planBasic", "planPro", "planPremium"] as const).map((k) => {
              const isPro = k === "planPro";
              return (
                <div
                  key={k}
                  className={`p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-950 ring-1 relative ${
                    isPro ? "ring-2 ring-violet-500 shadow-lg" : "ring-neutral-200 dark:ring-neutral-800"
                  }`}
                >
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {t(`home.pricingPreview.${k}.badge`)}
                    </div>
                  )}
                  <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 mb-2">
                    {t(`home.pricingPreview.${k}.name`)}
                  </p>
                  <p className="mb-2">
                    <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">{t(`home.pricingPreview.${k}.price`)}</span>
                    <span className="text-neutral-500 dark:text-neutral-400">{t(`home.pricingPreview.${k}.period`)}</span>
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    {t(`home.pricingPreview.${k}.desc`)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <Link href="/precios" className="inline-flex items-center gap-2 text-violet-700 dark:text-violet-300 hover:text-violet-900 dark:hover:text-violet-100 font-semibold">
              {t("home.pricingPreview.seeAll")} →
            </Link>
          </div>
        </div>
      </section>

      {/* COMPARISON — Fase 2 */}
      <ComparisonSection />

      {/* FAQ INLINE — Fase 2 */}
      <FaqInlineSection />

      {/* QUESTIONS */}
      <section className="py-16 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
            {t("home.questions.title")}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {t("home.questions.subtitle")}
          </p>
          <a
            href="mailto:info@aibookingassistant.app"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-sm font-semibold transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            {t("home.questions.cta")}
          </a>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 border-t border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-violet-600 to-violet-700 text-white">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("home.finalCta.title")}
          </h2>
          <p className="text-violet-100 text-lg mb-8">
            {t("home.finalCta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-md bg-white hover:bg-neutral-100 text-violet-700 text-base font-semibold transition-colors shadow-lg"
            >
              {t("home.finalCta.ctaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/precios"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-md bg-violet-800/50 hover:bg-violet-800/70 text-white text-base font-semibold transition-colors ring-1 ring-white/30"
            >
              {t("home.finalCta.ctaSecondary")}
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-violet-100">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> {t("home.finalCta.check1")}</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> {t("home.finalCta.check2")}</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> {t("home.finalCta.check3")}</span>
          </div>
        </div>
      </section>

      {/* WAITLIST — Fase 2 (final social proof) */}
      <WaitlistSection />
    </>
  );
}
