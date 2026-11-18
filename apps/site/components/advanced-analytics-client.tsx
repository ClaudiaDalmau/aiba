"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3, TrendingUp, TrendingDown, Users, UserPlus, Repeat,
  Loader2, Sparkles, Clock, CalendarClock, CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────

type KPIs = {
  window: "7d" | "30d";
  current: KPIWindow;
  previous: KPIWindow;
  deltas: Record<string, number | null>;
  current_start: string;
  previous_start: string;
};

type KPIWindow = {
  revenue_net_eur: number;
  bookings_total: number;
  bookings_completed: number;
  bookings_no_show: number;
  show_up_rate: number | null;
  no_show_rate: number | null;
  avg_ticket_eur: number | null;
  conversion_rate: number | null;
  unique_clients: number;
  new_clients: number;
  returning_clients: number;
};

type ClientMix = {
  days: number;
  totals: {
    new_clients: number;
    returning_clients: number;
    new_revenue_eur: number;
    returning_revenue_eur: number;
    new_bookings: number;
    returning_bookings: number;
  };
  top_returning: {
    client_id: string;
    name: string;
    bookings: number;
    revenue_eur: number;
  }[];
};

type BestTimes = {
  days: number;
  matrix: number[][]; // [7][24]
  by_hour: number[];
  by_weekday: number[];
  top_hours: number[];
  top_weekdays: number[];
};

const WEEKDAYS_SHORT = ["L", "M", "X", "J", "V", "S", "D"];
const WEEKDAYS_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function fmtEur(n: number): string {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtHour(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`;
}

function DeltaBadge({ value, invert = false }: { value: number | null; invert?: boolean }) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-neutral-400 dark:text-neutral-500">—</span>;
  }
  const positive = value > 0;
  const isGood = invert ? !positive : positive;
  const color = value === 0
    ? "text-neutral-500 dark:text-neutral-400"
    : isGood
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-red-600 dark:text-red-400";
  const Icon = value === 0 ? null : positive ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {positive && value !== 0 ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

// ─── Main component ─────────────────────────────────────────────

export default function AdvancedAnalyticsClient() {
  const [window, setWindow] = useState<"7d" | "30d">("7d");
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [mix, setMix] = useState<ClientMix | null>(null);
  const [times, setTimes] = useState<BestTimes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [k, m, t] = await Promise.all([
          api<KPIs>(`/analytics/advanced/kpis?window=${window}`),
          api<ClientMix>(`/analytics/advanced/client-mix?days=30`),
          api<BestTimes>(`/analytics/advanced/best-times?days=90`),
        ]);
        if (cancelled) return;
        setKpis(k);
        setMix(m);
        setTimes(t);
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message || "No se pudo cargar el panel");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [window]);

  if (loading || !kpis || !mix || !times) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const c = kpis.current;
  const d = kpis.deltas;

  const totalMix = mix.totals.new_clients + mix.totals.returning_clients;
  const newPct = totalMix > 0 ? (mix.totals.new_clients / totalMix) * 100 : 0;
  const returningPct = 100 - newPct;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <BarChart3 className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Métricas avanzadas</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Compara semana vs semana, descubre tus mejores horas y detecta
            clientes que vuelven.
          </p>
        </div>
        {/* Window selector */}
        <div className="inline-flex rounded-lg border border-neutral-200 dark:border-neutral-800 p-0.5 bg-white dark:bg-neutral-900">
          <button
            onClick={() => setWindow("7d")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
              window === "7d"
                ? "bg-primary text-primary-foreground"
                : "text-neutral-500 dark:text-neutral-400"
            }`}
          >
            7 días
          </button>
          <button
            onClick={() => setWindow("30d")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
              window === "30d"
                ? "bg-primary text-primary-foreground"
                : "text-neutral-500 dark:text-neutral-400"
            }`}
          >
            30 días
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          icon={<Sparkles className="h-4 w-4" />}
          label="Ingresos netos"
          value={`${fmtEur(c.revenue_net_eur)} €`}
          delta={<DeltaBadge value={d.revenue_net_eur} />}
        />
        <KPICard
          icon={<CalendarClock className="h-4 w-4" />}
          label="Reservas"
          value={c.bookings_total.toString()}
          sub={`${c.bookings_completed} completadas`}
          delta={<DeltaBadge value={d.bookings_total} />}
        />
        <KPICard
          icon={<XCircle className="h-4 w-4" />}
          label="Tasa de no-show"
          value={c.no_show_rate === null ? "—" : `${c.no_show_rate.toFixed(1)}%`}
          sub={`${c.bookings_no_show} no-show`}
          delta={<DeltaBadge value={d.no_show_rate} invert />}
        />
        <KPICard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Ticket medio"
          value={c.avg_ticket_eur === null ? "—" : `${fmtEur(c.avg_ticket_eur)} €`}
          sub="por cita completada"
          delta={<DeltaBadge value={d.avg_ticket_eur} />}
        />
      </div>

      {/* Client mix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-4 w-4 text-primary" />
            Clientes nuevos vs recurrentes
            <span className="text-xs font-normal text-neutral-500 ml-auto">
              Últimos {mix.days} días
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Split bar */}
          {totalMix > 0 ? (
            <>
              <div className="flex h-3 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <div
                  className="bg-emerald-500 transition-all"
                  style={{ width: `${newPct}%` }}
                />
                <div
                  className="bg-violet-500 transition-all"
                  style={{ width: `${returningPct}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                    <UserPlus className="h-3.5 w-3.5" />
                    <p className="text-xs font-semibold uppercase tracking-wide">Nuevos</p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mt-1">
                    {mix.totals.new_clients}
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-normal ml-1">
                      ({newPct.toFixed(0)}%)
                    </span>
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {fmtEur(mix.totals.new_revenue_eur)} € en ingresos
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-violet-200 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-950/20">
                  <div className="flex items-center gap-1.5 text-violet-700 dark:text-violet-300">
                    <Repeat className="h-3.5 w-3.5" />
                    <p className="text-xs font-semibold uppercase tracking-wide">Recurrentes</p>
                  </div>
                  <p className="text-2xl font-bold text-violet-800 dark:text-violet-200 mt-1">
                    {mix.totals.returning_clients}
                    <span className="text-sm text-violet-600 dark:text-violet-400 font-normal ml-1">
                      ({returningPct.toFixed(0)}%)
                    </span>
                  </p>
                  <p className="text-xs text-violet-700 dark:text-violet-400 mt-0.5">
                    {fmtEur(mix.totals.returning_revenue_eur)} € en ingresos
                  </p>
                </div>
              </div>
              {/* Top returning */}
              {mix.top_returning.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2 mt-2">
                    Top 5 clientas que más gastan
                  </p>
                  <ul className="space-y-1.5">
                    {mix.top_returning.map((c2, i) => (
                      <li
                        key={c2.client_id}
                        className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                      >
                        <span className="h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="flex-1 font-medium text-sm">{c2.name}</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {c2.bookings} citas
                        </span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {fmtEur(c2.revenue_eur)} €
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 py-6 text-center">
              Aún no tienes suficientes reservas en los últimos {mix.days} días para calcular este mix.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Best times heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-4 w-4 text-primary" />
            Tus mejores horas y días
            <span className="text-xs font-normal text-neutral-500 ml-auto">
              Últimos {times.days} días
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Heatmap matrix={times.matrix} />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1">
                Mejores días
              </p>
              {times.top_weekdays.length > 0 ? (
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {times.top_weekdays.map((w) => WEEKDAYS_FULL[w]).join(", ")}
                </p>
              ) : (
                <p className="text-sm text-neutral-500">—</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1">
                Mejores horas
              </p>
              {times.top_hours.length > 0 ? (
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {times.top_hours.map((h) => fmtHour(h)).join(", ")}
                </p>
              ) : (
                <p className="text-sm text-neutral-500">—</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function KPICard({
  icon,
  label,
  value,
  sub,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  delta?: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-1 text-neutral-500 dark:text-neutral-400 mb-1.5">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
        </div>
        {delta}
      </div>
      <p className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function Heatmap({ matrix }: { matrix: number[][] }) {
  const flat = useMemo(() => matrix.flat(), [matrix]);
  const max = useMemo(() => Math.max(1, ...flat), [flat]);

  // Compact: only render 8-22 hours (typical business range).
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8..22

  return (
    <div className="overflow-x-auto">
      <table className="text-[10px] w-full">
        <thead>
          <tr>
            <th className="w-6"></th>
            {hours.map((h) => (
              <th key={h} className="text-center text-neutral-400 font-normal p-0.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, wd) => (
            <tr key={wd}>
              <td className="text-neutral-500 dark:text-neutral-400 font-semibold pr-1">
                {WEEKDAYS_SHORT[wd]}
              </td>
              {hours.map((h) => {
                const v = row[h] || 0;
                const opacity = v === 0 ? 0.08 : 0.3 + (v / max) * 0.7;
                return (
                  <td key={h} className="p-0.5">
                    <div
                      title={`${WEEKDAYS_FULL[wd]} ${fmtHour(h)} · ${v} reservas`}
                      className="h-6 w-full rounded-sm"
                      style={{
                        backgroundColor: `rgba(124, 58, 237, ${opacity})`,
                      }}
                    />
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
