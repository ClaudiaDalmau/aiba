import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import ComparisonSection from "@/components/landing/comparison-section";
import FaqInlineSection from "@/components/landing/faq-inline-section";
import WaitlistSection from "@/components/landing/waitlist-section";
import LiveDemoBot from "@/components/landing/live-demo-bot";
import Reveal from "@/components/landing/reveal";
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

/** Parte un titular «Frase uno. Frase dos.» en dos tonos (la segunda en gris). */
function splitTitle(s: string): [string, string] {
  const m = s.match(/^(.+?[.!?。])\s+(.+)$/);
  return m ? [m[1], m[2]] : [s, ""];
}

const SECTORS = [
  { key: "health", img: "/images/sectors/salud.jpg" },
  { key: "beauty", img: "/images/sectors/belleza.jpg" },
  { key: "sports", img: "/images/sectors/deporte.jpg" },
  { key: "education", img: "/images/sectors/formacion.jpg" },
  { key: "legal", img: "/images/sectors/juridico.jpg" },
  { key: "events", img: "/images/sectors/eventos.jpg" },
  { key: "other", img: "/images/sectors/otros.jpg" },
] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [processA, processB] = splitTitle(t("home.process.title"));
  const [casesA, casesB] = splitTitle(t("home.cases.title"));
  const [ctaA, ctaB] = splitTitle(t("home.finalCta.title"));

  const glass =
    "rounded-[20px] bg-white/[0.06] ring-1 ring-white/[0.12] backdrop-blur-xl p-4 text-left";

  return (
    <>
      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden bg-[#050507] text-white">
        <div
          aria-hidden
          className="aiba-glow pointer-events-none absolute left-1/2 top-[420px] h-[900px] w-[900px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(124,58,237,0.45),rgba(124,58,237,0)_70%)]"
        />
        <div className="relative mx-auto max-w-[1100px] px-6 pt-20 md:pt-28 text-center">
          <Reveal>
            <p className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-[13px] text-neutral-300">
              {t("home.hero.badge")}
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="text-[clamp(44px,7.4vw,104px)] font-bold leading-[0.95] tracking-[-0.045em]">
              {t("home.hero.titleStart")}
              <br />
              <span className="aiba-grad-text">{t("home.hero.titleHighlight")}</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-7 max-w-[640px] text-lg md:text-[21px] leading-[1.45] text-neutral-400">
              {t("home.hero.subtitle")}
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-9 flex flex-wrap justify-center gap-3.5">
              <Link
                href="/register"
                className="rounded-full bg-violet-600 px-7 py-[15px] text-[17px] font-semibold text-white shadow-[0_10px_40px_-10px_rgba(124,58,237,0.8)] transition hover:bg-violet-500"
              >
                {t("home.hero.ctaPrimary")}
              </Link>
              <Link
                href="/como-funciona"
                className="rounded-full border border-white/25 px-7 py-[15px] text-[17px] font-medium text-white transition hover:bg-white/10"
              >
                {t("home.hero.ctaSecondary")} ›
              </Link>
            </div>
          </Reveal>

          {/* Teléfono + tarjetas flotantes */}
          <Reveal delay={320} className="relative mx-auto mt-16 md:mt-20 h-[560px] md:h-[640px] w-full max-w-[980px]">
            <div className="absolute left-1/2 top-0 h-[600px] md:h-[660px] w-[290px] md:w-[320px] -translate-x-1/2 rounded-[54px] bg-[#18181b] p-3 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.8),inset_0_0_0_2px_#3f3f46]">
              <div className="flex h-full w-full flex-col overflow-hidden rounded-[44px] bg-[#0b1220] text-left">
                <div className="flex items-center gap-2.5 border-b border-white/10 px-[18px] pb-3.5 pt-11">
                  <div className="grid h-[34px] w-[34px] place-items-center rounded-full bg-violet-600 text-[15px] font-extrabold">L</div>
                  <div>
                    <div className="text-sm font-semibold">{t("home.mock.chatName")}</div>
                    <div className="text-[11px] text-green-400">{t("home.mock.online")}</div>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 px-3.5 py-4 text-[13.5px] leading-[1.4]">
                  <div className="aiba-msg max-w-[78%] self-end rounded-[16px_16px_4px_16px] bg-[#1f2937] px-3 py-2.5" style={{ animationDelay: "0.9s" }}>{t("home.mock.m1")}</div>
                  <div className="aiba-msg max-w-[82%] self-start rounded-[16px_16px_16px_4px] bg-[#312e81] px-3 py-2.5" style={{ animationDelay: "1.7s" }}>{t("home.mock.m2")}</div>
                  <div className="aiba-msg max-w-[78%] self-end rounded-[16px_16px_4px_16px] bg-[#1f2937] px-3 py-2.5" style={{ animationDelay: "2.5s" }}>{t("home.mock.m3")}</div>
                  <div className="aiba-msg max-w-[82%] self-start rounded-[16px_16px_16px_4px] bg-[#312e81] px-3 py-2.5" style={{ animationDelay: "3.3s" }}>{t("home.mock.m4")}</div>
                  <div className="aiba-msg self-start rounded-xl bg-white px-3.5 py-2.5 text-[13px] font-semibold text-[#0b1220]" style={{ animationDelay: "3.9s" }}>{t("home.mock.pay")}</div>
                </div>
              </div>
            </div>
            <div className={`aiba-float hidden md:block absolute left-0 top-[150px] w-[250px] ${glass}`}>
              <div className="text-xs text-neutral-400">{t("home.mock.c1Label")}</div>
              <div className="mt-1 text-base font-semibold">{t("home.mock.c1Title")}</div>
              <div className="text-[13px] text-neutral-300">{t("home.mock.c1Sub")}</div>
            </div>
            <div className={`aiba-float-slow hidden md:block absolute right-0 top-[260px] w-[230px] ${glass}`}>
              <div className="text-xs text-neutral-400">{t("home.mock.c2Label")}</div>
              <div className="mt-1 text-[26px] font-bold tracking-[-0.02em]">{t("home.mock.c2Title")}</div>
              <div className="text-[13px] text-green-400">{t("home.mock.c2Sub")}</div>
            </div>
            <div className={`aiba-float hidden md:block absolute left-10 top-[430px] w-[230px] ${glass}`} style={{ animationDelay: "1.5s" }}>
              <div className="text-xs text-neutral-400">{t("home.mock.c3Label")}</div>
              <div className="mt-1 text-[15px] font-semibold">{t("home.mock.c3Title")}</div>
              <div className="text-[13px] text-neutral-300">{t("home.mock.c3Sub")}</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── CIFRAS ───────── */}
      <section className="bg-[#f5f5f7] dark:bg-neutral-900 px-6 py-20 md:py-24">
        <div className="mx-auto grid max-w-[1100px] gap-10 text-center sm:grid-cols-3">
          {(
            [
              ["attention247Number", "attention247Label"],
              ["timeNumber", "timeLabel"],
              ["secureNumber", "secureLabel"],
            ] as const
          ).map(([n, l], i) => (
            <Reveal key={n} delay={i * 100}>
              <div className="text-[56px] md:text-[72px] font-bold tracking-[-0.04em] text-neutral-900 dark:text-white">{t(`home.stats.${n}`)}</div>
              <div className="mt-1.5 text-[17px] text-neutral-600 dark:text-neutral-400">{t(`home.stats.${l}`)}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── PILOTO AUTOMÁTICO ───────── */}
      <section className="bg-white dark:bg-neutral-950 px-6 py-24 md:pb-28 md:pt-36">
        <div className="mx-auto max-w-[1100px]">
          <Reveal>
            <p className="text-[15px] font-semibold text-violet-600 dark:text-violet-400">{t("home.autopilot.label")}</p>
            <h2 className="mt-3.5 max-w-[900px] text-[clamp(36px,5vw,68px)] font-bold leading-[1.02] tracking-[-0.04em] text-neutral-900 dark:text-white">
              {t("home.autopilot.titleStart")}
              <span className="text-neutral-400 dark:text-neutral-500">{t("home.autopilot.titleHighlight")}</span>
            </h2>
          </Reveal>
          <div className="mt-16 md:mt-20 grid gap-12 md:grid-cols-3">
            {(["pillar1", "pillar2", "pillar3"] as const).map((p, i) => (
              <Reveal key={p} delay={i * 120} className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
                <div className="text-[13px] font-semibold text-violet-600 dark:text-violet-400">0{i + 1}</div>
                <h3 className="mb-2 mt-2.5 text-2xl font-semibold tracking-[-0.02em] text-neutral-900 dark:text-white">{t(`home.autopilot.${p}Title`)}</h3>
                <p className="text-base leading-[1.55] text-neutral-600 dark:text-neutral-400">{t(`home.autopilot.${p}Desc`)}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-20 text-center">
            <p className="mx-auto max-w-3xl text-2xl md:text-3xl font-medium leading-snug tracking-[-0.02em] text-neutral-800 dark:text-neutral-200">
              {t("home.autopilot.quoteStart")}
              <span className="text-violet-600 dark:text-violet-400 font-semibold">{t("home.autopilot.quoteHighlight")}</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───────── PROCESO (bento) ───────── */}
      <section className="bg-[#f5f5f7] dark:bg-neutral-900 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <Reveal>
            <h2 className="text-center text-[clamp(34px,4.4vw,60px)] font-bold leading-[1.04] tracking-[-0.04em] text-neutral-900 dark:text-white">
              {processA}
              {processB && (
                <>
                  <br />
                  <span className="text-neutral-400 dark:text-neutral-500">{processB}</span>
                </>
              )}
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal className="flex min-h-[340px] flex-col justify-between rounded-[28px] bg-[#050507] p-9 text-white">
              <div>
                <div className="text-[13px] font-semibold text-violet-400">{t("home.mock.stepLabel", { n: 1 })}</div>
                <h3 className="mb-2 mt-2.5 text-[26px] font-semibold leading-tight tracking-[-0.02em]">{t("home.process.step1Title")}</h3>
                <p className="leading-normal text-neutral-400">{t("home.process.step1Desc")}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-green-600 px-3 py-2 text-[13px] font-semibold">WhatsApp</span>
                <span className="rounded-full bg-sky-600 px-3 py-2 text-[13px] font-semibold">Telegram</span>
              </div>
            </Reveal>
            <Reveal delay={100} className="flex min-h-[340px] flex-col justify-between rounded-[28px] bg-white dark:bg-neutral-950 p-9">
              <div>
                <div className="text-[13px] font-semibold text-violet-600 dark:text-violet-400">{t("home.mock.stepLabel", { n: 2 })}</div>
                <h3 className="mb-2 mt-2.5 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-neutral-900 dark:text-white">{t("home.process.step2Title")}</h3>
                <p className="leading-normal text-neutral-600 dark:text-neutral-400">{t("home.process.step2Desc")}</p>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2 text-sm">
                <span className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-2.5 text-center">10:00</span>
                <span className="rounded-xl bg-violet-600 p-2.5 text-center font-semibold text-white">12:30</span>
                <span className="rounded-xl bg-neutral-100 dark:bg-neutral-800 p-2.5 text-center">17:00</span>
              </div>
            </Reveal>
            <Reveal delay={200} className="flex min-h-[340px] flex-col justify-between rounded-[28px] bg-white dark:bg-neutral-950 p-9">
              <div>
                <div className="text-[13px] font-semibold text-violet-600 dark:text-violet-400">{t("home.mock.stepLabel", { n: 3 })}</div>
                <h3 className="mb-2 mt-2.5 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-neutral-900 dark:text-white">{t("home.process.step3Title")}</h3>
                <p className="leading-normal text-neutral-600 dark:text-neutral-400">{t("home.process.step3Desc")}</p>
              </div>
              <div className="mt-6 text-[40px] font-bold tracking-[0.12em] text-neutral-900 dark:text-white">384 762</div>
            </Reveal>
            <Reveal delay={300} className="flex min-h-[340px] flex-col justify-between rounded-[28px] bg-gradient-to-br from-violet-600 to-violet-900 p-9 text-white">
              <div>
                <div className="text-[13px] font-semibold text-violet-200">{t("home.mock.stepLabel", { n: 4 })}</div>
                <h3 className="mb-2 mt-2.5 text-[26px] font-semibold leading-tight tracking-[-0.02em]">{t("home.process.step4Title")}</h3>
                <p className="leading-normal text-violet-100">{t("home.process.step4Desc")}</p>
              </div>
              <div className="mt-6 text-[40px] font-bold tracking-[-0.03em]">{t("home.mock.finalAmount")}</div>
            </Reveal>
          </div>
          <Reveal className="mt-10 text-center">
            <Link href="/como-funciona" className="text-[17px] font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              {t("home.process.seeFullProcess")} ›
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ───────── DEMO EN VIVO ───────── */}
      <section className="bg-white dark:bg-neutral-950 px-6 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 [&>*]:min-w-0">
          <Reveal>
            <p className="text-[15px] font-semibold text-violet-600 dark:text-violet-400">{t("home.demo.label")}</p>
            <h2 className="mt-3 text-[clamp(32px,3.6vw,48px)] font-bold leading-[1.05] tracking-[-0.035em] text-neutral-900 dark:text-white">
              {t("home.demo.title")}
            </h2>
            <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">{t("home.demo.subtitle")}</p>
            <ul className="mt-6 space-y-3 text-neutral-600 dark:text-neutral-400">
              {(["b1", "b2", "b3"] as const).map((k) => (
                <li key={k} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet-500" />
                  <span>{t(`home.demo.${k}`)}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <LiveDemoBot />
          </Reveal>
        </div>
      </section>

      {/* ───────── SECTORES ───────── */}
      <section id="cases" className="bg-white dark:bg-neutral-950 pb-24 pt-16 md:pb-32 md:pt-24">
        <Reveal className="mx-auto flex max-w-[1200px] flex-wrap items-end justify-between gap-6 px-6">
          <h2 className="text-[clamp(34px,4.4vw,60px)] font-bold leading-[1.04] tracking-[-0.04em] text-neutral-900 dark:text-white">
            {casesA}
            {casesB && (
              <>
                <br />
                <span className="text-neutral-400 dark:text-neutral-500">{casesB}</span>
              </>
            )}
          </h2>
          <Link href="/tipos-de-negocio" className="text-[17px] font-semibold text-violet-600 dark:text-violet-400 hover:underline">
            {t("home.cases.seeAll")} ›
          </Link>
        </Reveal>
        <div className="aiba-scroll-x mt-14 flex gap-4 overflow-x-auto pb-2 pl-6 pr-6 md:pl-[max(24px,calc((100%-1200px)/2+24px))]">
          {SECTORS.map((s, i) => (
            <Reveal key={s.key} delay={i * 70} className="aiba-sector relative h-[380px] w-[280px] flex-none overflow-hidden rounded-[28px] bg-neutral-900 text-white">
              <Image src={s.img} alt="" fill sizes="280px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent from-35% to-black/80" />
              <div className="absolute inset-x-7 bottom-7">
                <h3 className="mb-2 text-[26px] font-semibold tracking-[-0.02em]">{t(`home.cases.case.${s.key}.title`)}</h3>
                <p className="text-[15px] leading-normal text-neutral-200">{t(`home.cases.case.${s.key}.desc`)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── PRECIOS ───────── */}
      <section className="bg-[#f5f5f7] dark:bg-neutral-900 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <Reveal>
            <h2 className="text-center text-[clamp(34px,4.4vw,60px)] font-bold tracking-[-0.04em] text-neutral-900 dark:text-white">
              {t("home.pricingPreview.title")}
            </h2>
            <p className="mt-3.5 text-center text-[19px] text-neutral-600 dark:text-neutral-400">{t("home.pricingPreview.subtitle")}</p>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {(["planBasic", "planPro", "planPremium"] as const).map((k, i) => {
              const pro = k === "planPro";
              return (
                <Reveal
                  key={k}
                  delay={i * 100}
                  className={`rounded-[28px] p-9 ${pro ? "bg-[#050507] text-white" : "bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"}`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    {t(`home.pricingPreview.${k}.name`)}
                    {pro && (
                      <span className="rounded-full bg-violet-600 px-2.5 py-1 text-xs">{t("home.pricingPreview.planPro.badge")}</span>
                    )}
                  </div>
                  <div className="mt-4 text-[52px] font-bold tracking-[-0.04em]">
                    {t(`home.pricingPreview.${k}.price`)}
                    <span className={`text-[17px] font-medium ${pro ? "text-neutral-400" : "text-neutral-500"}`}>
                      {t(`home.pricingPreview.${k}.period`)}
                    </span>
                  </div>
                  <p className={pro ? "text-neutral-400" : "text-neutral-600 dark:text-neutral-400"}>{t(`home.pricingPreview.${k}.desc`)}</p>
                  <Link
                    href="/register"
                    className={`mt-6 block rounded-full py-3.5 text-center font-semibold transition ${
                      pro ? "bg-violet-600 text-white hover:bg-violet-500" : "ring-1 ring-neutral-300 dark:ring-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {t("home.hero.ctaPrimary")}
                  </Link>
                </Reveal>
              );
            })}
          </div>
          <Reveal className="mt-10 text-center">
            <Link href="/precios" className="text-[17px] font-semibold text-violet-600 dark:text-violet-400 hover:underline">
              {t("home.pricingPreview.seeAll")} ›
            </Link>
          </Reveal>
        </div>
      </section>

      <ComparisonSection />
      <FaqInlineSection />

      {/* ───────── CTA FINAL ───────── */}
      <section className="relative overflow-hidden bg-[#050507] px-6 py-32 md:py-40 text-center text-white">
        <div
          aria-hidden
          className="aiba-glow pointer-events-none absolute -bottom-[400px] left-1/2 h-[700px] w-[1000px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(124,58,237,0.5),rgba(124,58,237,0)_70%)]"
        />
        <Reveal className="relative">
          <h2 className="text-[clamp(44px,6vw,88px)] font-bold leading-[0.98] tracking-[-0.045em]">
            {ctaA}
            {ctaB && (
              <>
                <br />
                <span className="aiba-grad-text">{ctaB}</span>
              </>
            )}
          </h2>
          <p className="mt-6 text-[19px] text-neutral-400">{t("home.finalCta.subtitle")}</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3.5">
            <Link href="/register" className="rounded-full bg-white px-8 py-4 text-[17px] font-semibold text-[#050507] transition hover:bg-neutral-200">
              {t("home.finalCta.ctaPrimary")}
            </Link>
            <Link href="/precios" className="rounded-full border border-white/25 px-8 py-4 text-[17px] font-medium transition hover:bg-white/10">
              {t("home.finalCta.ctaSecondary")} ›
            </Link>
          </div>
          <p className="mt-6 text-sm text-neutral-500">
            {t("home.finalCta.check1")} · {t("home.finalCta.check2")} · {t("home.finalCta.check3")}
          </p>
        </Reveal>
      </section>

      <WaitlistSection />
    </>
  );
}
