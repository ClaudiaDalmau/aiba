"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, Users, DollarSign, Zap, Loader2, Trophy, Phone,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, BarChart, Bar,
} from "recharts";
import { toast } from "sonner";

type MrrPayload = {
  months: { month: string; label: string; revenue_eur: number; bookings: number }[];
  total_revenue_eur: number;
  current_month_eur: number;
  growth_pct_mom: number | null;
};

type FunnelPayload = {
  period_days: number;
  visits: number;
  starts: number;
  confirmed: number;
  start_rate_pct: number;
  confirm_rate_pct: number;
  overall_conversion_pct: number;
};

type TopClient = {
  client_id: string;
  name: string;
  phone?: string | null;
  bookings: number;
  revenue_eur: number;
  last_booking_at?: string | null;
};

type Overview = {
  mrr: MrrPayload;
  funnel: FunnelPayload;
  top_clients: TopClient[];
};

function fmtEur(n: number): string {
  return n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function GrowthClient() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const o = await api<Overview>("/analytics/growth/overview");
        setData(o);
      } catch (e: any) {
        toast.error(e?.message || "No se pudo cargar el crecimiento");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }
  if (!data) return null;

  const { mrr, funnel, top_clients } = data;
  const growth = mrr.growth_pct_mom;
  const growthColor = growth == null
    ? "text-neutral-500"
    : growth > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500";
  const GrowthIcon = growth == null ? Zap : growth > 0 ? TrendingUp : TrendingDown;

  const funnelData = [
    { stage: "Visitas", value: funnel.visits, fill: "hsl(var(--primary))" },
    { stage: "Iniciaron", value: funnel.starts, fill: "hsl(var(--primary) / 0.75)" },
    { stage: "Confirmadas", value: funnel.confirmed, fill: "hsl(var(--primary) / 0.5)" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <TrendingUp className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Crecimiento</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Cómo evoluciona tu negocio mes a mes. Ingresos, conversión y clientes fieles.
          </p>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs">
              <DollarSign className="h-3.5 w-3.5" /> Este mes
            </div>
            <div className="text-2xl font-bold mt-1 tabular-nums">
              {fmtEur(mrr.current_month_eur)}€
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs">
              <GrowthIcon className={`h-3.5 w-3.5 ${growthColor}`} /> vs mes anterior
            </div>
            <div className={`text-2xl font-bold mt-1 tabular-nums ${growthColor}`}>
              {growth == null ? "—" : `${growth > 0 ? "+" : ""}${growth}%`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs">
              💰 Últimos 6 meses
            </div>
            <div className="text-2xl font-bold mt-1 tabular-nums">
              {fmtEur(mrr.total_revenue_eur)}€
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs">
              🎯 Conversión total
            </div>
            <div className="text-2xl font-bold mt-1 tabular-nums">
              {funnel.overall_conversion_pct}%
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              últimos {funnel.period_days} días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MRR chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos por mes</CardTitle>
        </CardHeader>
        <CardContent>
          {mrr.months.every((m) => m.revenue_eur === 0) ? (
            <div className="text-sm text-neutral-500 text-center py-10">
              Todavía no hay ingresos registrados. Se actualizará automáticamente
              cuando confirmes tu primer pago.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mrr.months} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="label" fontSize={12} stroke="#94a3b8" />
                  <YAxis fontSize={12} stroke="#94a3b8" tickFormatter={(v) => `${v}€`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    formatter={(value) => [`${fmtEur(Number(value) || 0)}€`, "Ingresos"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue_eur"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#mrrGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funnel + Top clients */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Embudo de conversión (30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            {funnel.visits === 0 ? (
              <div className="text-sm text-neutral-500 text-center py-8">
                Comparte tu página pública de reservas para empezar a ver visitas.
              </div>
            ) : (
              <>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical" margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis type="number" fontSize={12} stroke="#94a3b8" />
                      <YAxis type="category" dataKey="stage" width={90} fontSize={12} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div>
                    <div className="text-xs text-neutral-500">Empiezan</div>
                    <div className="text-sm font-semibold tabular-nums">{funnel.start_rate_pct}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">Confirman</div>
                    <div className="text-sm font-semibold tabular-nums">{funnel.confirm_rate_pct}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500">Total</div>
                    <div className="text-sm font-semibold text-primary tabular-nums">
                      {funnel.overall_conversion_pct}%
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Top clientes (12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {top_clients.length === 0 ? (
              <div className="text-sm text-neutral-500 text-center py-8">
                Tus mejores clientes aparecerán aquí en cuanto sumen 2+ reservas.
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {top_clients.map((c, i) => (
                  <li key={c.client_id} className="py-3 flex items-center gap-3">
                    <span className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-amber-500 text-white"
                      : i === 1 ? "bg-neutral-400 text-white"
                      : i === 2 ? "bg-orange-400 text-white"
                      : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{c.name}</div>
                      {c.phone && (
                        <div className="text-xs text-neutral-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold tabular-nums">
                        {fmtEur(c.revenue_eur)}€
                      </div>
                      <div className="text-xs text-neutral-500">
                        {c.bookings} {c.bookings === 1 ? "reserva" : "reservas"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
