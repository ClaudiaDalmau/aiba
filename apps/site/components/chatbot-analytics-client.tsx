"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Sparkles, MessagesSquare, TrendingUp, Clock, Loader2, RefreshCw,
  Globe2, Cpu, CheckCircle2, Users,
} from "lucide-react";

type Range = "7d" | "30d" | "90d" | "all";

type ChatbotAnalytics = {
  range: Range;
  kpis: {
    total_conversations: number;
    bookings_created: number;
    conversion_rate: number;
    total_messages: number;
    time_saved_min: number;
    time_saved_hours: number;
  };
  languages: Record<string, number>;
  models: Record<string, number>;
  status: Record<string, number>;
  activity: { day: string; conversations: number; bookings: number }[];
  top_clients: { client_id: string; name: string; bookings_via_ai: number }[];
};

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`/api/backend${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const LANG_FLAGS: Record<string, string> = {
  es: "🇪🇸", en: "🇬🇧", pt: "🇧🇷", "pt-BR": "🇧🇷",
  fr: "🇫🇷", it: "🇮🇹", de: "🇩🇪", ru: "🇷🇺",
};
const LANG_NAMES: Record<string, string> = {
  es: "Español", en: "English", "pt-BR": "Português", pt: "Português",
  fr: "Français", it: "Italiano", de: "Deutsch", ru: "Русский",
};

export default function ChatbotAnalyticsClient() {
  const [range, setRange] = useState<Range>("30d");
  const [data, setData] = useState<ChatbotAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await api<ChatbotAnalytics>(`/analytics/chatbot?range=${range}`);
      setData(d);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { void load(); }, [load]);

  const maxActivity = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, ...data.activity.map((a) => a.conversations));
  }, [data]);

  const langBars = useMemo(() => {
    if (!data) return [];
    const total = Object.values(data.languages).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(data.languages)
      .sort((a, b) => b[1] - a[1])
      .map(([lang, count]) => ({ lang, count, pct: (count / total) * 100 }));
  }, [data]);

  const modelBars = useMemo(() => {
    if (!data) return [];
    const total = Object.values(data.models).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(data.models)
      .sort((a, b) => b[1] - a[1])
      .map(([model, count]) => ({ model, count, pct: (count / total) * 100 }));
  }, [data]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-600" />
            Analytics del Chatbot IA
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Conversiones, latencia y tiempo ahorrado por tu asistente conversacional.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-100 dark:bg-neutral-800/60 rounded-md p-1">
            {(["7d", "30d", "90d", "all"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  range === r
                    ? "bg-white dark:bg-neutral-950 text-violet-700 dark:text-violet-300 shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                {r === "all" ? "Todo" : r}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Refrescar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-md bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-16 text-neutral-500">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Kpi
              icon={<MessagesSquare className="h-4 w-4" />}
              label="Conversaciones"
              value={data.kpis.total_conversations}
              sub={`${data.kpis.total_messages} mensajes procesados`}
            />
            <Kpi
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Reservas creadas"
              value={data.kpis.bookings_created}
              sub="por el bot IA directamente"
              accent="emerald"
            />
            <Kpi
              icon={<TrendingUp className="h-4 w-4" />}
              label="Tasa de conversión"
              value={`${data.kpis.conversion_rate}%`}
              sub="conversaciones → reservas"
              accent="violet"
            />
            <Kpi
              icon={<Clock className="h-4 w-4" />}
              label="Tiempo ahorrado"
              value={data.kpis.time_saved_hours >= 1 ? `${data.kpis.time_saved_hours}h` : `${data.kpis.time_saved_min}m`}
              sub="que no dedicaste a contestar"
              accent="amber"
            />
          </div>

          {/* Activity chart */}
          <Card title="Actividad diaria" subtitle="Conversaciones y reservas por día">
            {data.activity.length === 0 ? (
              <Empty label="Sin actividad en este periodo" />
            ) : (
              <ActivityChart data={data.activity} max={maxActivity} />
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Languages */}
            <Card title="Idiomas de los clientes" subtitle="Distribución por conversación" icon={<Globe2 className="h-4 w-4" />}>
              {langBars.length === 0 ? (
                <Empty label="Sin datos aún" />
              ) : (
                <div className="space-y-3">
                  {langBars.map((lb) => (
                    <div key={lb.lang}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                          <span>{LANG_FLAGS[lb.lang] || "🌐"}</span>
                          <span>{LANG_NAMES[lb.lang] || lb.lang.toUpperCase()}</span>
                        </span>
                        <span className="text-neutral-500 text-xs tabular-nums">
                          {lb.count} · {lb.pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                          style={{ width: `${lb.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Models */}
            <Card title="Modelos de IA utilizados" subtitle="Claude / GPT fallback" icon={<Cpu className="h-4 w-4" />}>
              {modelBars.length === 0 ? (
                <Empty label="Sin datos aún" />
              ) : (
                <div className="space-y-3">
                  {modelBars.map((mb) => (
                    <div key={mb.model}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-mono text-neutral-700 dark:text-neutral-300 text-xs">
                          {mb.model}
                        </span>
                        <span className="text-neutral-500 text-xs tabular-nums">
                          {mb.count} · {mb.pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                        <div
                          className={`h-full ${
                            mb.model.includes("anthropic") || mb.model.includes("claude")
                              ? "bg-gradient-to-r from-orange-400 to-orange-600"
                              : mb.model.includes("openai") || mb.model.includes("gpt")
                                ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                                : "bg-gradient-to-r from-neutral-400 to-neutral-600"
                          }`}
                          style={{ width: `${mb.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Top clients */}
          <Card title="Top clientes por reservas vía IA" subtitle="Los que más usan tu chatbot" icon={<Users className="h-4 w-4" />} className="mt-4">
            {data.top_clients.length === 0 ? (
              <Empty label="Todavía ningún cliente ha reservado vía IA en este rango" />
            ) : (
              <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {data.top_clients.map((c, i) => (
                  <div key={c.client_id} className="flex items-center gap-3 py-2.5">
                    <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-neutral-800 dark:text-neutral-200">{c.name}</span>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      {c.bookings_via_ai} reservas
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Value note */}
          <div className="mt-6 rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 p-5 ring-1 ring-violet-200 dark:ring-violet-900/40">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-violet-600 flex-none mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-violet-900 dark:text-violet-200">
                  Estimación de tiempo ahorrado
                </p>
                <p className="text-sm text-violet-800 dark:text-violet-300 mt-1">
                  Basado en {data.kpis.total_messages} mensajes procesados por tu chatbot,
                  te has ahorrado aproximadamente <b>{data.kpis.time_saved_hours}h</b> respondiendo
                  a mano (calculado a ~1.5 min por mensaje: revisar agenda + escribir + confirmar).
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Kpi({
  icon, label, value, sub, accent = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  accent?: "neutral" | "emerald" | "violet" | "amber";
}) {
  const accentCls = {
    neutral: "",
    emerald: "text-emerald-700 dark:text-emerald-300",
    violet: "text-violet-700 dark:text-violet-300",
    amber: "text-amber-700 dark:text-amber-300",
  }[accent];
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
      <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-xs font-medium mb-1">
        {icon} {label}
      </div>
      <div className={`text-2xl font-bold ${accentCls || "text-neutral-900 dark:text-neutral-100"}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-neutral-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function Card({
  title, subtitle, icon, children, className,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 p-5 ${className || ""}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
      </div>
      {subtitle && <p className="text-xs text-neutral-500 mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-neutral-500 py-6 text-center">{label}</p>;
}

function ActivityChart({
  data,
  max,
}: {
  data: { day: string; conversations: number; bookings: number }[];
  max: number;
}) {
  // Simple bar chart — one bar per day, with a smaller inner bar for bookings.
  const daysToShow = data.length > 45 ? data.slice(-45) : data;
  return (
    <div>
      <div className="flex items-end gap-[3px] h-32">
        {daysToShow.map((d) => {
          const hConv = Math.max(2, (d.conversations / max) * 100);
          const hBook = d.conversations > 0 ? (d.bookings / d.conversations) * hConv : 0;
          return (
            <div key={d.day} className="flex-1 relative group" title={`${d.day} · ${d.conversations} conv · ${d.bookings} reservas`}>
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t bg-violet-200 dark:bg-violet-900/40"
                style={{ height: `${hConv}%` }}
              />
              {hBook > 0 && (
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t bg-emerald-500"
                  style={{ height: `${hBook}%` }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-neutral-500 mt-2">
        <span>{daysToShow[0]?.day}</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-violet-200 dark:bg-violet-900/40" /> conversación</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> reserva</span>
        </span>
        <span>{daysToShow[daysToShow.length - 1]?.day}</span>
      </div>
    </div>
  );
}
