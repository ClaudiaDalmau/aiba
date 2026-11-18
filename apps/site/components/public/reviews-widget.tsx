"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Client → Pro reviews widget for the public booking landing.
 *
 * Loads `/api/public/pro/{slug}/reviews` on mount. Shows avg + last N
 * reviews with a comment; empty state if none. Kept dependency-free —
 * mounts on the same page as BookingWidget.
 */

type Review = {
  review_id: string;
  stars: number;
  comment: string | null;
  client_name: string | null;
  sub_ratings: Record<string, number> | null;
  created_at: string;
};

type ReviewsData = {
  avg_stars: number | null;
  count: number;
  distribution: Record<string, number>;
  avg_sub_ratings: Record<string, number>;
  recent: Review[];
};

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

// Axis label + emoji shown alongside each sub-rating average.
const AXIS_META: Record<string, { emoji: string; keyEs: string }> = {
  cleanliness_apt: { emoji: "🏠", keyEs: "reviewsAxisCleanliness" },
  hygiene:         { emoji: "🧼", keyEs: "reviewsAxisHygiene" },
  attitude:        { emoji: "💬", keyEs: "reviewsAxisAttitude" },
};

function StarRow({ n, max = 5 }: { n: number; max?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${n} de ${max} estrellas`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < n ? "fill-amber-400 text-amber-400" : "text-neutral-300 dark:text-neutral-700"
          }`}
        />
      ))}
    </span>
  );
}

export function ReviewsWidget({ slug }: { slug: string }) {
  const t = useTranslations("publicBooking");
  const locale = useLocale();
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const url = API_BASE
      ? `${API_BASE}/api/public/pro/${slug}/reviews`
      : `/api/public/pro/${slug}/reviews`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) { setData(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return null;
  if (!data) return null;

  return (
    <Card className="mt-6">
      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {t("reviewsTitle")}
          </h2>
          {data.count > 0 && data.avg_stars != null && (
            <div className="flex items-center gap-2 text-sm">
              <StarRow n={Math.round(data.avg_stars)} />
              <span className="text-neutral-600 dark:text-neutral-300">
                {t("reviewsAvg", { avg: data.avg_stars.toFixed(1), count: data.count })}
              </span>
            </div>
          )}
        </div>

        {data.count === 0 || data.recent.length === 0 ? (
          <div className="text-sm text-neutral-500 py-2">
            {t("reviewsEmpty")}
          </div>
        ) : (
          <>
            {/* Per-axis averages with progress bars (limpieza / higiene / actitud) */}
            {data.avg_sub_ratings && Object.keys(data.avg_sub_ratings).length > 0 && (
              <div className="grid gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                {Object.entries(AXIS_META).map(([axis, meta]) => {
                  const avg = data.avg_sub_ratings[axis];
                  if (avg == null) return null;
                  const pct = Math.max(0, Math.min(100, (avg / 5) * 100));
                  return (
                    <div key={axis} className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 w-40 shrink-0">
                        <span className="text-base">{meta.emoji}</span>
                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                          {t(meta.keyEs)}
                        </span>
                      </div>
                      <div className="flex-1 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                          role="progressbar"
                          aria-valuenow={avg}
                          aria-valuemin={0}
                          aria-valuemax={5}
                        />
                      </div>
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 w-8 text-right tabular-nums">
                        {avg.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <ul className="space-y-3">
              {data.recent.slice(0, 5).map((r) => (
                <li
                  key={r.review_id}
                  className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-white dark:bg-neutral-900"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <StarRow n={r.stars} />
                      <span className="text-xs text-neutral-500">
                        {t("reviewsBy")}{" "}
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">
                          {r.client_name || "—"}
                        </span>
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(r.created_at).toLocaleDateString(locale, {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {r.comment}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
