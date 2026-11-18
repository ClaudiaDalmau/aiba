import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, Sparkles, Heart } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about.meta" });
  return buildPageMetadata({ locale, path: "/nosotros", title: t("title"), description: t("desc") });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  const VALUES = [
    { titleKey: "v1Title", descKey: "v1Desc" },
    { titleKey: "v2Title", descKey: "v2Desc" },
    { titleKey: "v3Title", descKey: "v3Desc" },
  ];

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 px-3 py-1 text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />{t("badge")}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-6 leading-tight">
              {t("titleStart")}<span className="text-violet-600 dark:text-violet-400">{t("titleHighlight")}</span>
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">{t("intro")}</p>
          </div>
          <div className="rounded-2xl overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-xl">
            <Image src="/samples/style_c_photo_ui_overlay.png" alt="" width={1344} height={768} className="w-full h-auto" />
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-12">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">{t("missionTitle")}</h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">{t("mission")}</p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">{t("originTitle")}</h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">{t("origin1")}</p>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">{t("origin2")}</p>
          </div>
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-neutral-200 dark:border-neutral-800">
            {["stat1", "stat2", "stat3"].map((k) => (
              <div key={k} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-violet-600 dark:text-violet-400 mb-1">{t(`${k}Label`)}</p>
                <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400">{t(k)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 border-t border-neutral-200 dark:border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 font-semibold mb-3">{t("valuesLabel")}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">{t("valuesTitle")}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <div key={v.titleKey} className="p-6 rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">{t(v.titleKey)}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{t(v.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-violet-600 to-violet-700 text-white">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <Heart className="h-10 w-10 mx-auto mb-4 text-violet-200" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("ctaTitle")}</h2>
          <p className="text-violet-100 text-lg mb-8">{t("ctaSubtitle")}</p>
          <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-md bg-white hover:bg-neutral-100 text-violet-700 text-base font-semibold transition-colors shadow-lg">
            {t("ctaBtn")}<ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
