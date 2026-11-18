"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Trophy, ChevronRight, Sparkles } from "lucide-react";

type Badge = {
  key: string;
  title: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
  threshold: number;
  current_value: number;
  progress_pct: number | null;
  earned_at?: string;
};

type BadgesResp = {
  total_badges: number;
  earned_count: number;
  newly_earned: string[];
  earned: Badge[];
  locked: Badge[];
};

const TIER_COLOR: Record<Badge["tier"], string> = {
  bronze: "from-orange-100 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30",
  silver: "from-slate-100 to-neutral-50 dark:from-slate-800/40 dark:to-neutral-900/40",
  gold:   "from-yellow-100 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/30",
};

function fmtValue(b: Badge): string {
  const isRevenue = ["first_1000_eur", "ten_k_eur", "fifty_k_eur"].includes(b.key);
  const cur = Math.min(b.current_value, b.threshold);
  if (isRevenue) {
    return `${cur.toLocaleString("es-ES", { maximumFractionDigits: 0 })} / ${b.threshold.toLocaleString("es-ES")} €`;
  }
  return `${cur} / ${b.threshold}`;
}

/**
 * Iter83 — Next-badge progress widget for the analytics home.
 *
 * Renders the pro's closest-to-completion locked badge so they always see a
 * "why to keep going" cue at the top of the dashboard. Silent when the API
 * fails or the pro has already unlocked every badge — never blocks the UI.
 */
export function NextBadgeWidget() {
  const [next, setNext] = useState<Badge | null>(null);
  const [earnedCount, setEarnedCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await api<BadgesResp>("/badges/mine");
        if (cancelled) return;
        setEarnedCount(d.earned_count);
        setTotalCount(d.total_badges);
        // First locked badge = highest progress % (already sorted by API)
        setNext(d.locked[0] || null);
      } catch {
        // Silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || (!next && earnedCount === 0)) return null;

  // All badges earned — celebratory summary card.
  if (!next) {
    return (
      <Link
        href="/badges"
        className="group flex items-center gap-4 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 hover:shadow-md transition-shadow"
      >
        <div className="h-14 w-14 rounded-full bg-white dark:bg-neutral-900 border-4 border-amber-400 flex items-center justify-center text-3xl shadow-inner">
          👑
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase font-bold tracking-wider text-amber-700 dark:text-amber-300">
            ¡Enhorabuena!
          </p>
          <p className="font-bold text-neutral-900 dark:text-neutral-100">
            Has completado los {totalCount} logros
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Eres oficialmente élite de AIBA.
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600 shrink-0" />
      </Link>
    );
  }

  const pct = next.progress_pct ?? 0;

  return (
    <Link
      href="/badges"
      className={`group flex items-center gap-4 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br ${TIER_COLOR[next.tier]} hover:shadow-md transition-shadow`}
    >
      <div className="relative shrink-0">
        <div className="h-14 w-14 rounded-full bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-3xl grayscale opacity-80">
          {next.icon}
        </div>
        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Sparkles className="h-3 w-3 text-primary" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <Trophy className="h-3 w-3 text-primary shrink-0" />
          <p className="text-[10px] uppercase font-bold tracking-wider text-primary">
            Próximo logro
          </p>
        </div>
        <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate mt-0.5">
          {next.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 rounded-full bg-white/50 dark:bg-neutral-800/50 overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-neutral-700 dark:text-neutral-300 font-semibold shrink-0">
            {fmtValue(next)}
          </span>
        </div>
        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1">
          {pct >= 80 ? "¡Falta muy poco!" :
           pct >= 40 ? "Vas por buen camino." :
                       "Sigue así."} · Llevas <b>{earnedCount}/{totalCount}</b> logros
        </p>
      </div>

      <ChevronRight className="h-5 w-5 text-neutral-400 group-hover:text-neutral-600 shrink-0" />
    </Link>
  );
}
