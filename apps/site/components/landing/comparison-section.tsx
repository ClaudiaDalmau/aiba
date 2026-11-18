// Comparison table vs top booking competitors.
// Kept neutral: shows features side-by-side, no explicit negative claims.
import { useTranslations } from "next-intl";
import { Check, X, Minus, TrendingUp } from "lucide-react";

type Cell = "yes" | "no" | "partial";

type Row = {
  featureKey: string;
  aib: Cell;
  calendly: Cell;
  booksy: Cell;
  fresha: Cell;
  gcal: Cell;
};

const ROWS: Row[] = [
  { featureKey: "aiBot", aib: "yes", calendly: "no", booksy: "no", fresha: "no", gcal: "no" },
  { featureKey: "reminders", aib: "yes", calendly: "partial", booksy: "yes", fresha: "yes", gcal: "no" },
  { featureKey: "deposit", aib: "yes", calendly: "yes", booksy: "yes", fresha: "yes", gcal: "no" },
  { featureKey: "clientDatabase", aib: "yes", calendly: "no", booksy: "yes", fresha: "yes", gcal: "no" },
  { featureKey: "sharedBlacklist", aib: "yes", calendly: "no", booksy: "no", fresha: "no", gcal: "no" },
  { featureKey: "multiLang", aib: "yes", calendly: "partial", booksy: "partial", fresha: "yes", gcal: "yes" },
  { featureKey: "gdpr", aib: "yes", calendly: "partial", booksy: "partial", fresha: "partial", gcal: "partial" },
  { featureKey: "flatFee", aib: "yes", calendly: "yes", booksy: "no", fresha: "no", gcal: "yes" },
];

function Ic({ v }: { v: Cell }) {
  if (v === "yes")
    return <Check className="h-5 w-5 text-violet-600 dark:text-violet-400 mx-auto" strokeWidth={3} />;
  if (v === "partial")
    return <Minus className="h-5 w-5 text-amber-500 mx-auto" strokeWidth={3} />;
  return <X className="h-5 w-5 text-neutral-300 dark:text-neutral-700 mx-auto" strokeWidth={2.5} />;
}

export default function ComparisonSection() {
  const t = useTranslations("home.comparison");

  return (
    <section className="py-16 md:py-24 border-t border-neutral-200 dark:border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-3 py-1 text-xs font-medium mb-4">
            <TrendingUp className="h-3.5 w-3.5" />
            {t("badge")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-4">
            {t("title")}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <table className="w-full min-w-[720px] text-sm bg-white dark:bg-neutral-900">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="text-left px-4 py-4 font-semibold text-neutral-700 dark:text-neutral-300 min-w-[220px]">
                  {t("featureHeader")}
                </th>
                <th className="px-3 py-4 text-center min-w-[120px] bg-violet-50 dark:bg-violet-950/30 border-x border-violet-200 dark:border-violet-900/60">
                  <div className="font-bold text-violet-700 dark:text-violet-300">AI Booking</div>
                  <div className="text-[10px] uppercase tracking-wide text-violet-600 dark:text-violet-400 mt-0.5">
                    {t("us")}
                  </div>
                </th>
                <th className="px-3 py-4 text-center min-w-[100px] font-medium text-neutral-600 dark:text-neutral-400">
                  Calendly
                </th>
                <th className="px-3 py-4 text-center min-w-[100px] font-medium text-neutral-600 dark:text-neutral-400">
                  Booksy
                </th>
                <th className="px-3 py-4 text-center min-w-[100px] font-medium text-neutral-600 dark:text-neutral-400">
                  Fresha
                </th>
                <th className="px-3 py-4 text-center min-w-[100px] font-medium text-neutral-600 dark:text-neutral-400">
                  {t("gcal")}
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={row.featureKey}
                  className={i % 2 === 0 ? "bg-neutral-50/50 dark:bg-neutral-900/40" : ""}
                >
                  <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200 font-medium">
                    {t(`rows.${row.featureKey}`)}
                  </td>
                  <td className="px-3 py-3 text-center bg-violet-50/60 dark:bg-violet-950/20 border-x border-violet-100 dark:border-violet-950/40">
                    <Ic v={row.aib} />
                  </td>
                  <td className="px-3 py-3"><Ic v={row.calendly} /></td>
                  <td className="px-3 py-3"><Ic v={row.booksy} /></td>
                  <td className="px-3 py-3"><Ic v={row.fresha} /></td>
                  <td className="px-3 py-3"><Ic v={row.gcal} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" strokeWidth={3} />
            {t("legend.yes")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Minus className="h-3.5 w-3.5 text-amber-500" strokeWidth={3} />
            {t("legend.partial")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <X className="h-3.5 w-3.5 text-neutral-400" strokeWidth={2.5} />
            {t("legend.no")}
          </span>
        </div>

        <p className="text-center text-xs text-neutral-500 dark:text-neutral-500 mt-4 italic">
          {t("disclaimer")}
        </p>
      </div>
    </section>
  );
}
