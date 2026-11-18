"use client";

import { useTranslations } from "next-intl";

/**
 * Compact per-weekday hours summary rendered on the public /book/[slug] page
 * so clients can see availability at a glance without navigating the picker.
 *
 * Data comes from the `weekly_hours` field on GET /api/public/pro/{slug}.
 * Weekdays with no rules render as "Closed".
 */
type WeekdayHours = { weekday: number; ranges: string[] };

export function WeeklyHours({ hours }: { hours: WeekdayHours[] }) {
  const t = useTranslations("publicBooking");
  if (!hours || hours.length === 0) return null;

  const days = t.raw("weekdays") as string[];
  const byDay = new Map(hours.map((h) => [h.weekday, h.ranges]));

  return (
    <section className="mt-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">
        {t("weeklyHoursTitle")}
      </h2>
      <ul className="space-y-1">
        {days.map((label, wd) => {
          const ranges = byDay.get(wd);
          const closed = !ranges || ranges.length === 0;
          return (
            <li
              key={wd}
              className="flex items-center justify-between text-sm gap-3"
            >
              <span className={`font-medium w-12 ${closed ? "text-neutral-400" : ""}`}>
                {label}
              </span>
              <span className={closed ? "text-neutral-400" : "text-neutral-700 dark:text-neutral-300"}>
                {closed ? t("weeklyHoursClosed") : ranges!.join(" · ")}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
