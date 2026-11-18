"use client";
/**
 * ProfilesCompareCard — Iter56 (P2 Fase 1.3)
 *
 * Renders a compact side-by-side KPI comparison across every active
 * profile of the current pro. Each row is a KPI; each column is a
 * profile. Winner cells get a subtle trophy affordance. Empty accounts
 * (single profile) show a friendly nudge instead of an empty table.
 *
 * Data source: `GET /api/analytics/profiles-compare?range={7d|30d|90d|all}`
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3, Wallet, Calendar, CheckCheck, UserX, TrendingUp,
  Receipt, Users, Trophy, Info, ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { fmtEur, fmtInt, fmtPct } from "@/lib/format";

type Range = "7d" | "30d" | "90d" | "all";

type Kpis = {
  revenue_net_eur: number;
  bookings_total: number;
  bookings_completed: number;
  bookings_no_show: number;
  show_up_rate: number | null;
  avg_ticket_eur: number | null;
  unique_clients: number;
};

type ProfileEntry = {
  profile_id: string;
  alias: string;
  city: string | null;
  is_default: boolean;
  photo_base64: string | null;
  current: Kpis;
  previous: Kpis;
};

type Winners = Partial<Record<keyof Kpis, string | null>>;

type Resp = {
  range: Range;
  profiles: ProfileEntry[];
  winners: Winners;
};

// KPI metadata: label, formatter, icon, deltaSign (1 = higher better).
type KpiDef = {
  key: keyof Kpis;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  format: (v: number | null) => string;
  goodDir: "up" | "down";
};

const KPIS: KpiDef[] = [
  { key: "revenue_net_eur",   label: "Ingresos netos", icon: Wallet,     format: (v) => v == null ? "—" : fmtEur(v),   goodDir: "up" },
  { key: "bookings_total",    label: "Reservas",       icon: Calendar,   format: (v) => v == null ? "—" : fmtInt(v),   goodDir: "up" },
  { key: "bookings_completed",label: "Completadas",    icon: CheckCheck, format: (v) => v == null ? "—" : fmtInt(v),   goodDir: "up" },
  { key: "bookings_no_show",  label: "No-shows",       icon: UserX,      format: (v) => v == null ? "—" : fmtInt(v),   goodDir: "down" },
  { key: "show_up_rate",      label: "Show-up rate",   icon: TrendingUp, format: (v) => v == null ? "—" : fmtPct(v),   goodDir: "up" },
  { key: "avg_ticket_eur",    label: "Ticket medio",   icon: Receipt,    format: (v) => v == null ? "—" : fmtEur(v),   goodDir: "up" },
  { key: "unique_clients",    label: "Clientes",       icon: Users,      format: (v) => v == null ? "—" : fmtInt(v),   goodDir: "up" },
];

const RANGES: { key: Range; label: string }[] = [
  { key: "7d",  label: "7d"  },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "all", label: "Todo" },
];

export default function ProfilesCompareCard() {
  const [range, setRange] = useState<Range>("30d");
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (r: Range) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api<Resp>(`/analytics/profiles-compare?range=${r}`);
      setData(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(range); }, [load, range]);

  const profiles = data?.profiles ?? [];
  const winners = data?.winners ?? {};

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-violet-600" />
            <div>
              <CardTitle>Comparativa entre perfiles</CardTitle>
              <CardDescription>
                Métricas clave de cada perfil activo. El icono 🏆 marca al líder de cada fila
                {" · "}
                <span className="inline-flex items-center gap-1 text-violet-700 dark:text-violet-300">
                  <ArrowUp className="h-3 w-3" /> vs. periodo anterior
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {RANGES.map((r) => (
              <Button
                key={r.key}
                size="sm"
                variant={r.key === range ? "default" : "outline"}
                onClick={() => setRange(r.key)}
                className="h-7 px-2 text-xs"
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-40" />
          </div>
        ) : err ? (
          <ErrorState message={err} />
        ) : profiles.length === 0 ? (
          <EmptyState message="No hay perfiles activos" />
        ) : profiles.length === 1 ? (
          <SingleProfileHint profile={profiles[0]} />
        ) : (
          <CompareTable profiles={profiles} winners={winners} />
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-200">
      <p className="font-semibold mb-1">No se pudieron cargar las métricas.</p>
      <p className="text-xs opacity-80">{message}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-neutral-200 dark:border-neutral-800 p-6 text-center">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{message}</p>
    </div>
  );
}

function SingleProfileHint({ profile }: { profile: ProfileEntry }) {
  return (
    <div className="rounded-md border border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/20 p-4 flex items-start gap-3">
      <Info className="h-5 w-5 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
      <div className="text-sm text-violet-900 dark:text-violet-100 space-y-1">
        <p className="font-semibold">Solo tienes un perfil activo ({profile.alias}).</p>
        <p className="text-xs opacity-80">
          Duplica un perfil desde la app móvil (o usa el botón <em>Duplicar</em> en <em>Ajustes → Fotos de perfil</em>) para empezar a comparar métricas entre ciudades, especializaciones o alias.
        </p>
      </div>
    </div>
  );
}

function CompareTable({ profiles, winners }: { profiles: ProfileEntry[]; winners: Winners }) {
  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="text-left text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold pb-3 pr-4 align-bottom">
              KPI
            </th>
            {profiles.map((p) => (
              <th key={p.profile_id} className="text-left align-bottom px-3 pb-3 min-w-[150px]">
                <ProfileHeader profile={p} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {KPIS.map((k, i) => (
            <tr key={k.key} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
              <td className={`py-2 pr-4 text-neutral-700 dark:text-neutral-300 font-medium ${i > 0 ? "border-t border-neutral-100 dark:border-neutral-900" : ""}`}>
                <span className="inline-flex items-center gap-1.5">
                  <k.icon className="h-3.5 w-3.5 text-neutral-400" />
                  {k.label}
                </span>
              </td>
              {profiles.map((p) => {
                const cur = p.current[k.key] as number | null;
                const prev = p.previous[k.key] as number | null;
                const isWinner = winners[k.key] === p.profile_id;
                return (
                  <td
                    key={p.profile_id}
                    className={`py-2 px-3 tabular-nums ${i > 0 ? "border-t border-neutral-100 dark:border-neutral-900" : ""} ${isWinner ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold ${isWinner ? "text-amber-700 dark:text-amber-300" : "text-neutral-900 dark:text-neutral-100"}`}>
                        {k.format(cur)}
                      </span>
                      {isWinner && (
                        <Trophy className="h-3.5 w-3.5 text-amber-500" aria-label="Líder de esta métrica" />
                      )}
                      <Delta current={cur} previous={prev} goodDir={k.goodDir} />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProfileHeader({ profile }: { profile: ProfileEntry }) {
  const initial = (profile.alias?.[0] || "?").toUpperCase();
  return (
    <div className="flex items-center gap-2">
      {profile.photo_base64 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.photo_base64}
          alt={profile.alias}
          className="h-8 w-8 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-800"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold text-xs">
          {initial}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate leading-tight">
          {profile.alias}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          {profile.is_default && (
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 uppercase tracking-wider">
              Principal
            </Badge>
          )}
          {profile.city && (
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">{profile.city}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Small delta arrow with % change. Green when moving in the "good" direction. */
function Delta({
  current, previous, goodDir,
}: {
  current: number | null;
  previous: number | null;
  goodDir: "up" | "down";
}) {
  if (current == null || previous == null) return null;
  if (previous === 0 && current === 0) return null;
  if (previous === 0) {
    // New value from zero. Show "new" indicator.
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
        <ArrowUp className="h-2.5 w-2.5" />NUEVO
      </span>
    );
  }
  const rawPct = ((current - previous) / Math.abs(previous)) * 100;
  const up = rawPct > 0;
  const flat = Math.abs(rawPct) < 0.5;
  const good = flat ? null : (up === (goodDir === "up"));
  const color = flat
    ? "text-neutral-400"
    : good
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-rose-600 dark:text-rose-400";
  const Icon = flat ? Minus : (up ? ArrowUp : ArrowDown);
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${color}`} aria-label={`${up ? "+" : ""}${rawPct.toFixed(0)}% vs previo`}>
      <Icon className="h-2.5 w-2.5" />
      {Math.abs(rawPct).toFixed(0)}%
    </span>
  );
}
