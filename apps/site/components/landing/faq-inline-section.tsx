// FAQ inline section for the landing page — 6 curated questions.
// Uses <details>/<summary> for zero-JS accordions (native browser accessibility).
// The full FAQ page at /faq has 16+ items.
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HelpCircle, ChevronDown, ArrowRight } from "lucide-react";

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6"];

export default function FaqInlineSection() {
  const t = useTranslations("home.faqInline");

  return (
    <section id="faq" className="py-16 md:py-24 bg-neutral-50 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-800">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 px-3 py-1 text-xs font-medium mb-4">
            <HelpCircle className="h-3.5 w-3.5" />
            {t("badge")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-4">
            {t("title")}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_KEYS.map((key) => (
            <details
              key={key}
              className="group rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:border-violet-300 dark:hover:border-violet-800 transition-colors"
            >
              <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none select-none">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-base">
                  {t(`items.${key}.q`)}
                </span>
                <ChevronDown className="h-4 w-4 text-neutral-500 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-4 -mt-1 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line">
                {t(`items.${key}.a`)}
              </div>
            </details>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300"
          >
            {t("seeAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
