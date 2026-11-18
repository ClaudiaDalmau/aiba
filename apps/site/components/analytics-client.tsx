"use client";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, CartesianGrid, LineChart, Line,
} from "recharts";
import {
  Wallet, Calendar, CheckCheck, Star, Sparkles, TrendingDown, AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { fmtEur, fmtInt, fmtPct } from "@/lib/format";
import ProfilesCompareCard from "@/components/analytics/profiles-compare-card";
import ShareMyPageWidget from "@/components/share-my-page-widget";
import { NextBadgeWidget } from "@/components/next-badge-widget";

type Range = "7d" | "30d" | "90d" | "all";

type Kpis = {
  revenue_gross_eur: number;
  revenue_net_eur: number;
  revenue_deposits_eur: number;
  revenue_final_eur: number;
  revenue_refunded_eur: number;
  platform_fees_eur: number;
  net_payout_eur: number;
  bookings_total: number;
  bookings_completed: number;
  bookings_cancelled: number;
  bookings_no_show: number;
  bookings_upcoming: number;
  show_up_rate: number | null;
  cancellation_rate: number | null;
  avg_ticket_eur: number | null;
  unique_clients: number;
  recurring_clients: number;
  recurring_rate: number | null;
  avg_rating: number | null;
  ratings_count: number;
};
type SeriesPoint = { date: string; revenue_eur: number; bookings: number };
type TopService = { service_id: string; name: string; price_eur: number; bookings: number; completed: number; revenue_eur: number };
type TopClient = { client_id: string; name: string; phone?: string | null; bookings: number; completed: number; revenue_eur: number; is_blacklisted: boolean };
type Overview = {
  range: Range;
  period: { start: string | null; end: string };
  kpis: Kpis;
  revenue_series: SeriesPoint[];
  top_services: TopService[];
  top_clients: TopClient[];
};

const RANGES: { key: Range; label: string }[] = [
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "90d", label: "90 días" },
  { key: "all", label: "Todo" },
];

export default function AnalyticsClient({ isSensitiveVertical = false }: { isSensitiveVertical?: boolean }) {
  const [range, setRange] = useState<Range>("30d");
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Iter67 — share widget data
  const [shareInfo, setShareInfo] = useState<{ booking_slug: string | null; public_url: string | null; business_name: string | null } | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    api<Overview>(`/analytics/overview?range=${range}`, { signal: ctrl.signal })
      .then((r) => setData(r))
      .catch((e) => { if (e.name !== "AbortError") setError(e.message); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [range]);

  useEffect(() => {
    // Fire-and-forget: don't block the dashboard for the share widget.
    api<{ booking_slug: string | null; public_url: string | null; business_name: string | null }>("/me/share-info")
      .then(setShareInfo)
      .catch(() => setShareInfo({ booking_slug: null, public_url: null, business_name: null }));
  }, []);

  const k = data?.kpis;
  const chartData = (data?.revenue_series || []).map((s) => ({
    date: s.date.slice(5),
    revenue: s.revenue_eur,
    bookings: s.bookings,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">Módulo 7 · Analytics</p>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Panorama de tu negocio</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-1">
            Ingresos, tasa de asistencia y clientes recurrentes en tiempo real.
          </p>
        </div>
        <div className="inline-flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg self-start sm:self-auto">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                r.key === range
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:text-neutral-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md border-red-200 bg-red-50 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Iter67 — Share my page widget (delight) */}
      {shareInfo && (
        <ShareMyPageWidget
          publicUrl={shareInfo.public_url || ""}
          bookingSlug={shareInfo.booking_slug}
          businessName={shareInfo.business_name}
        />
      )}

      {/* Iter83 — Next-badge progress widget (delight) */}
      <NextBadgeWidget />

      {/* KPI Grid */}
      <div className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {loading || !k ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
        ) : (
          <>
            <KpiTile
              icon={Wallet}
              color="violet"
              label="Ingresos netos"
              value={fmtEur(k.revenue_net_eur)}
              sub={`Depósitos ${fmtEur(k.revenue_deposits_eur)} · Final ${fmtEur(k.revenue_final_eur)}`}
            />
            <KpiTile
              icon={Calendar}
              color="teal"
              label="Reservas"
              value={fmtInt(k.bookings_total)}
              sub={`${k.bookings_completed} completadas · ${k.bookings_upcoming} próximas`}
            />
            <KpiTile
              icon={CheckCheck}
              color={k.show_up_rate !== null && k.show_up_rate < 70 ? "red" : "emerald"}
              label="Show-up rate"
              value={fmtPct(k.show_up_rate)}
              sub={`${k.bookings_no_show} no-shows`}
            />
            <KpiTile
              icon={Star}
              color="amber"
              label="Rating"
              value={k.avg_rating !== null ? `${k.avg_rating}⭐` : "—"}
              sub={`${k.ratings_count} reseñas`}
            />
            <KpiTile
              icon={Sparkles}
              color="violet"
              label="AI Pay fee"
              value={k.platform_fees_eur > 0 ? `−${fmtEur(k.platform_fees_eur)}` : fmtEur(0)}
              sub={`Payout ${fmtEur(k.net_payout_eur)}`}
            />
          </>
        )}
      </div>

      {/* Iter56 P2 Fase 1.3 — Multi-profile KPI comparison.
          Renders below the top KPI cards so pros can quickly spot which
          alias/city is outperforming the rest before drilling into per-day
          charts. Card lazily fetches its own data (`/profiles-compare`). */}
      <ProfilesCompareCard />

      {/* Revenue chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Ingresos por día</CardTitle>
              <CardDescription>{chartData.length} días de actividad</CardDescription>
            </div>
            {k && (
              <Badge variant="outline" className="text-neutral-600 dark:text-neutral-400 dark:text-neutral-500">
                Bruto {fmtEur(k.revenue_gross_eur)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-56" />
          ) : chartData.length === 0 ? (
            <p className="text-center py-16 text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">Sin ingresos en este rango.</p>
          ) : (
            <ResponsiveContainer width="100%" height={224}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grad-rev" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#737373" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#737373" }} tickLine={false} axisLine={false} width={42} tickFormatter={(v) => `${v}€`} />
                <RTooltip
                  cursor={{ fill: "#f5f3ff" }}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 12 }}
                  formatter={(v: any) => [fmtEur(Number(v)), "Ingresos"]}
                />
                <Bar dataKey="revenue" fill="url(#grad-rev)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bookings trend + Outcomes */}
      <div className="grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reservas por día</CardTitle>
            <CardDescription>Tendencia de nuevas citas</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40" />
            ) : chartData.length === 0 ? (
              <p className="text-center py-10 text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">Sin datos.</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3" stroke="#e5e5e5" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#737373" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: "#737373" }} tickLine={false} axisLine={false} width={28} />
                  <RTooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 12 }} />
                  <Line type="monotone" dataKey="bookings" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3, fill: "#0f766e" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resultados de reservas</CardTitle>
            <CardDescription>Distribución por estado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading || !k ? (
              <Skeleton className="h-40" />
            ) : (
              <>
                <OutcomeBar
                  completed={k.bookings_completed}
                  cancelled={k.bookings_cancelled}
                  noShow={k.bookings_no_show}
                  upcoming={k.bookings_upcoming}
                />
                <div className="grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <LegendItem color="#059669" label="Completadas" value={k.bookings_completed} />
                  <LegendItem color="#dc2626" label="No show" value={k.bookings_no_show} />
                  <LegendItem color="#f59e0b" label="Canceladas" value={k.bookings_cancelled} />
                  <LegendItem color="#7c3aed" label="Próximas" value={k.bookings_upcoming} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clients mini-stats */}
      <div className="grid-cols-2 lg:grid-cols-4 gap-3">
        {loading || !k ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : (
          <>
            <MiniStat label="Clientes únicos" value={fmtInt(k.unique_clients)} />
            <MiniStat label="Recurrentes" value={fmtInt(k.recurring_clients)} />
            <MiniStat label="% Recurrencia" value={fmtPct(k.recurring_rate)} />
            <MiniStat label="Ticket medio" value={fmtEur(k.avg_ticket_eur)} />
          </>
        )}
      </div>

      {/* Top services & Top clients */}
      <div className="grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top servicios</CardTitle>
            <CardDescription>Por ingresos generados</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 my-1" />)
            ) : (data?.top_services || []).length === 0 ? (
              <p className="text-center py-6 text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">Sin datos.</p>
            ) : data!.top_services.map((s, idx) => (
              <div key={s.service_id} className="flex items-center gap-3 py-3">
                <div className="h-7 w-7 rounded-full bg-violet-100 text-violet-800 flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{s.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">{s.completed}/{s.bookings} completadas · {fmtEur(s.price_eur)}</p>
                </div>
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{fmtEur(s.revenue_eur)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top clientes</CardTitle>
            <CardDescription>Por ingresos aportados</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 my-1" />)
            ) : (data?.top_clients || []).length === 0 ? (
              <p className="text-center py-6 text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">Sin datos.</p>
            ) : data!.top_clients.map((c) => (
              <div key={c.client_id} className="flex items-center gap-3 py-3">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${c.is_blacklisted && isSensitiveVertical ? "bg-red-100 text-red-700" : "bg-violet-100 text-violet-800"}`}>
                  {c.is_blacklisted && isSensitiveVertical ? "🚫" : (c.name?.[0]?.toUpperCase() || "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{c.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">{c.completed}/{c.bookings} completadas{c.phone ? ` · ${c.phone}` : ""}</p>
                </div>
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{fmtEur(c.revenue_eur)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center pt-2">
        Ingresos calculados sobre pagos completados · Show-up = completadas / (completadas + no-shows)
      </p>
    </div>
  );
}

function KpiTile({
  icon: Icon, color, label, value, sub,
}: {
  icon: any; color: "violet" | "teal" | "emerald" | "amber" | "red";
  label: string; value: string; sub?: string;
}) {
  const colorMap = {
    violet: { bg: "bg-violet-100", text: "text-violet-700" },
    teal: { bg: "bg-teal-100", text: "text-teal-700" },
    emerald: { bg: "bg-emerald-100", text: "text-emerald-700" },
    amber: { bg: "bg-amber-100", text: "text-amber-700" },
    red: { bg: "bg-red-100", text: "text-red-700" },
  };
  const c = colorMap[color];
  return (
    <Card className="p-3 gap-2">
      <div className={`h-8 w-8 rounded-full ${c.bg} flex items-center justify-center`}>
        <Icon className={`h-4 w-4 ${c.text}`} />
      </div>
      <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">{label}</p>
      <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-neutral-400 dark:text-neutral-500 line-clamp-2">{sub}</p>}
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3 gap-1 items-center text-center">
      <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 font-semibold">{label}</p>
    </Card>
  );
}

function OutcomeBar({ completed, cancelled, noShow, upcoming }: {
  completed: number; cancelled: number; noShow: number; upcoming: number;
}) {
  const total = completed + cancelled + noShow + upcoming;
  if (total === 0) return <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 py-6">Sin reservas.</p>;
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="h-4 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex">
      {completed > 0 && <div style={{ width: pct(completed) }} className="bg-emerald-600" />}
      {noShow > 0 && <div style={{ width: pct(noShow) }} className="bg-red-600" />}
      {cancelled > 0 && <div style={{ width: pct(cancelled) }} className="bg-amber-500" />}
      {upcoming > 0 && <div style={{ width: pct(upcoming) }} className="bg-violet-600" />}
    </div>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 flex-1">{label}</span>
      <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{value}</span>
    </div>
  );
}
