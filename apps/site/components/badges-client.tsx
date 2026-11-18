"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Loader2, Lock, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Confetti } from "@/components/badges-confetti";

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
  stats: Record<string, number>;
};

const TIER_STYLES: Record<Badge["tier"], { ring: string; glow: string; label: string }> = {
  bronze: {
    ring: "ring-orange-300 dark:ring-orange-700",
    glow: "bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30",
    label: "Bronce",
  },
  silver: {
    ring: "ring-neutral-300 dark:ring-neutral-500",
    glow: "bg-gradient-to-br from-slate-100 to-neutral-50 dark:from-slate-800/40 dark:to-neutral-900/40",
    label: "Plata",
  },
  gold: {
    ring: "ring-amber-400 dark:ring-amber-500",
    glow: "bg-gradient-to-br from-yellow-100 to-amber-50 dark:from-yellow-950/40 dark:to-amber-950/30",
    label: "Oro",
  },
};

function fmtValue(b: Badge): string {
  // Revenue tiers show €, others show plain numbers.
  const isRevenue = ["first_1000_eur", "ten_k_eur", "fifty_k_eur"].includes(b.key);
  if (isRevenue) {
    return `${Math.min(b.current_value, b.threshold).toLocaleString("es-ES", { maximumFractionDigits: 0 })} / ${b.threshold.toLocaleString("es-ES")} €`;
  }
  return `${Math.min(b.current_value, b.threshold)} / ${b.threshold}`;
}

export default function BadgesClient() {
  const [data, setData] = useState<BadgesResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await api<BadgesResp>("/badges/mine");
        setData(d);
        if (d.newly_earned.length > 0) {
          setConfetti(true);
          toast.success(
            d.newly_earned.length === 1
              ? "¡Nuevo logro desbloqueado!"
              : `¡${d.newly_earned.length} nuevos logros desbloqueados!`,
          );
          setTimeout(() => setConfetti(false), 5500);
        }
      } catch (e: any) {
        toast.error(e?.message || "No se pudieron cargar los logros");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const progress = (data.earned_count / data.total_badges) * 100;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      {confetti && <Confetti />}

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Trophy className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Tus logros</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Cada meta que alcanzas te acerca a la élite de AIBA.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase font-semibold tracking-wide text-neutral-500 dark:text-neutral-400">
            Progreso
          </p>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {data.earned_count}
            <span className="text-sm text-neutral-500 dark:text-neutral-400 font-normal">
              /{data.total_badges}
            </span>
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
        <div className="h-2 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-primary via-fuchsia-500 to-amber-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          {progress < 100
            ? `Estás al ${progress.toFixed(0)}%. Sigue así.`
            : "¡Has completado todos los logros disponibles!"}
        </p>
      </div>

      {/* Earned */}
      {data.earned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Conseguidos ({data.earned.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.earned.map((b) => (
                <EarnedCard key={b.key} b={b} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked */}
      {data.locked.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-4 w-4 text-primary" />
              Próximos retos ({data.locked.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.locked.map((b) => (
                <LockedRow key={b.key} b={b} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function EarnedCard({ b }: { b: Badge }) {
  const t = TIER_STYLES[b.tier];
  return (
    <div
      className={`relative p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 ${t.glow} text-center hover:shadow-lg transition-shadow`}
    >
      <div className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center text-4xl ring-4 ${t.ring} bg-white dark:bg-neutral-900 shadow-inner`}>
        {b.icon}
      </div>
      <p className="mt-2 font-bold text-sm text-neutral-900 dark:text-neutral-100">
        {b.title}
      </p>
      <p className="mt-0.5 text-[11px] text-neutral-600 dark:text-neutral-400 leading-tight">
        {b.description}
      </p>
      <span className="inline-block mt-2 text-[9px] uppercase font-bold tracking-wider text-neutral-500 dark:text-neutral-400">
        {t.label}
      </span>
    </div>
  );
}

function LockedRow({ b }: { b: Badge }) {
  const t = TIER_STYLES[b.tier];
  const pct = b.progress_pct ?? 0;
  return (
    <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-3">
      <div className="relative h-12 w-12 rounded-full flex items-center justify-center text-2xl bg-neutral-100 dark:bg-neutral-800 grayscale opacity-70">
        {b.icon}
        <div className="absolute inset-0 rounded-full flex items-center justify-center">
          <Lock className="h-3 w-3 text-neutral-400 dark:text-neutral-500 absolute bottom-1 right-1 bg-neutral-100 dark:bg-neutral-800 rounded-full p-0.5 h-4 w-4" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
            {b.title}
          </p>
          <span className="text-[9px] uppercase font-bold text-neutral-400 dark:text-neutral-500">
            {t.label}
          </span>
        </div>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
          {b.description}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-neutral-500 dark:text-neutral-400 font-semibold">
            {fmtValue(b)}
          </span>
        </div>
      </div>
    </div>
  );
}
