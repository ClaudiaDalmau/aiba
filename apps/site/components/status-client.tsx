"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, ArrowLeft, Loader2,
  Server, Database, MessageCircle, CreditCard, Mail, Phone, Sparkles, Zap, Clock,
} from "lucide-react";

type ServiceStatus = "ok" | "degraded" | "down" | "unknown";

type DailyBar = { date: string; status: ServiceStatus; total?: number; up?: number; down?: number };

type Service = {
  key: string;
  label: string;
  critical: boolean;
  status: ServiceStatus;
  latency_ms: number;
  detail: string;
  uptime_30d_pct: number | null;
  daily_bars: DailyBar[];
};

type Snapshot = {
  overall: ServiceStatus;
  checked_at: string;
  services: Service[];
};

type Incident = {
  service: string;
  service_label: string;
  critical: boolean;
  started_at: string;
  resolved_at: string | null;
  duration_sec: number | null;
  status: "resolved" | "ongoing";
  was_paged: boolean;
};

type IncidentsResp = {
  count: number;
  ongoing: number;
  window_days: number;
  incidents: Incident[];
};

const ICONS: Record<string, any> = {
  api: Server,
  database: Database,
  telegram: MessageCircle,
  payments: CreditCard,
  email: Mail,
  phone: Phone,
  ai_llm: Sparkles,
};

const STATUS_COPY: Record<ServiceStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  ok:       { label: "Operativo",       color: "text-emerald-700",  bg: "bg-emerald-50",  border: "border-emerald-200",  icon: CheckCircle2 },
  degraded: { label: "Con incidencias", color: "text-amber-700",    bg: "bg-amber-50",    border: "border-amber-200",    icon: AlertTriangle },
  down:     { label: "Caído",           color: "text-red-700",      bg: "bg-red-50",      border: "border-red-200",      icon: XCircle },
  unknown:  { label: "Sin datos",       color: "text-neutral-600",  bg: "bg-neutral-50",  border: "border-neutral-200",  icon: Loader2 },
};

const BAR_COLOR: Record<ServiceStatus, string> = {
  ok:       "bg-emerald-500",
  degraded: "bg-amber-400",
  down:     "bg-red-500",
  unknown:  "bg-neutral-300",
};

export default function StatusPage() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [incidents, setIncidents] = useState<IncidentsResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const statusUrl = base
        ? `${base.replace(/\/$/, "")}/api/public/status`
        : "/api/backend/public/status";
      const incUrl = base
        ? `${base.replace(/\/$/, "")}/api/public/incidents?days=90&limit=10`
        : "/api/backend/public/incidents?days=90&limit=10";
      const [rs, ri] = await Promise.all([
        fetch(statusUrl, { cache: "no-store" }),
        fetch(incUrl, { cache: "no-store" }),
      ]);
      if (!rs.ok) throw new Error(`HTTP ${rs.status}`);
      setData(await rs.json());
      if (ri.ok) setIncidents(await ri.json());
      setError(null);
    } catch (e: any) {
      setError(e?.message || "No pudimos cargar el estado.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  const overallCopy = data ? STATUS_COPY[data.overall] : STATUS_COPY.unknown;
  const OverallIcon = overallCopy.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-300 mb-6"
        >
          <ArrowLeft className="h-3 w-3" /> Volver a la web
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Estado del sistema
            </p>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              ¿Cómo estamos hoy?
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 max-w-lg">
              Comprobamos cada 5 minutos que todos los servicios respondan. Este panel refresca automáticamente cada 30 segundos.
            </p>
          </div>
          <button
            onClick={load}
            disabled={refreshing}
            aria-label="Refrescar"
            className="p-2 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700"
          >
            <RefreshCw className={`h-4 w-4 text-neutral-500 dark:text-neutral-400 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Overall banner */}
        {error ? (
          <div className="p-6 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 flex items-center gap-4">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400 shrink-0" />
            <div>
              <p className="font-semibold text-red-900 dark:text-red-100">No pudimos cargar el estado</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">{error}</p>
            </div>
          </div>
        ) : data ? (
          <div className={`p-6 rounded-2xl border ${overallCopy.border} ${overallCopy.bg} dark:bg-opacity-20 flex items-center gap-4`}>
            <OverallIcon className={`h-10 w-10 ${overallCopy.color} shrink-0`} />
            <div className="flex-1">
              <p className={`text-xl font-bold ${overallCopy.color}`}>
                {data.overall === "ok" && "Todos los sistemas operativos"}
                {data.overall === "degraded" && "Algunos servicios están degradados"}
                {data.overall === "down" && "Hay una incidencia crítica en curso"}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Última comprobación: {new Date(data.checked_at).toLocaleTimeString("es-ES")}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-2xl border border-neutral-200 bg-white dark:bg-neutral-800 dark:border-neutral-700 flex items-center gap-4">
            <Loader2 className="h-8 w-8 text-neutral-400 animate-spin" />
            <p className="text-neutral-500 dark:text-neutral-400">Comprobando servicios...</p>
          </div>
        )}

        {/* Services list */}
        {data && (
          <div className="mt-8 space-y-3">
            {data.services.map((svc) => {
              const Icon = ICONS[svc.key] || Server;
              const copy = STATUS_COPY[svc.status];
              const StatusIcon = copy.icon;
              return (
                <div
                  key={svc.key}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${copy.bg} dark:bg-opacity-20`}>
                      <Icon className={`h-5 w-5 ${copy.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">{svc.label}</p>
                        {svc.critical && (
                          <span className="text-[10px] uppercase font-bold text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-300 px-1.5 py-0.5 rounded">
                            Crítico
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StatusIcon className={`h-3 w-3 ${copy.color}`} />
                        <p className={`text-xs font-semibold ${copy.color}`}>
                          {copy.label}
                        </p>
                        {svc.latency_ms > 0 && (
                          <span className="text-xs text-neutral-400 dark:text-neutral-500">· {svc.latency_ms} ms</span>
                        )}
                        {svc.detail && (
                          <span className="text-xs text-neutral-400 dark:text-neutral-500 truncate">· {svc.detail}</span>
                        )}
                      </div>
                    </div>
                    {svc.uptime_30d_pct !== null && (
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Uptime 30d</p>
                        <p className={`text-sm font-bold ${
                          svc.uptime_30d_pct >= 99
                            ? "text-emerald-600 dark:text-emerald-400"
                            : svc.uptime_30d_pct >= 95
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          {svc.uptime_30d_pct.toFixed(2)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 30-day bar timeline */}
                  <div className="mt-3">
                    <div className="flex gap-[2px] h-6 items-end">
                      {svc.daily_bars.map((bar, i) => (
                        <div
                          key={i}
                          title={`${bar.date} · ${bar.status}${bar.total ? ` · ${bar.up}/${bar.total} checks OK` : ""}`}
                          className={`flex-1 rounded-sm ${BAR_COLOR[bar.status]} ${
                            bar.status === "unknown" ? "opacity-40" : "opacity-90 hover:opacity-100"
                          }`}
                          style={{ minWidth: 4, height: bar.status === "unknown" ? 6 : 24 }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                      <span>hace 30 días</span>
                      <span>hoy</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Iter77 — Incidents feed */}
        {incidents && (
          <div className="mt-10">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Incidentes recientes
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Últimos {incidents.window_days} días
                {incidents.ongoing > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
                    · {incidents.ongoing} en curso
                  </span>
                )}
              </p>
            </div>
            {incidents.count === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  Sin incidentes en los últimos {incidents.window_days} días
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  Todos los servicios han funcionado correctamente.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {incidents.incidents.map((inc, i) => (
                  <IncidentRow key={`${inc.service}-${inc.started_at}-${i}`} inc={inc} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 p-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <b>¿Notas un problema que no está reflejado aquí?</b> Escríbenos a{" "}
            <a href="mailto:soporte@aibookingassistant.app" className="text-violet-700 dark:text-violet-300 hover:underline font-medium">
              soporte@aibookingassistant.app
            </a>{" "}
            y lo revisamos al momento.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Iter77 — Incidents feed
// ---------------------------------------------------------------------------
function formatDurationSec(sec: number | null): string {
  if (sec === null || sec === undefined) return "—";
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ${sec % 60}s`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}m`;
}

function IncidentRow({ inc }: { inc: Incident }) {
  const ongoing = inc.status === "ongoing";
  const bg = ongoing
    ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800";
  const dotColor = ongoing ? "bg-red-500 animate-pulse" : "bg-emerald-500";
  const dateFmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("es-ES", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    }) : "—";

  return (
    <div className={`p-3 rounded-lg border ${bg} flex items-start gap-3`}>
      <div className={`h-2 w-2 rounded-full ${dotColor} mt-1.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
            {inc.service_label}
          </p>
          {inc.critical && (
            <span className="text-[9px] uppercase font-bold text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-300 px-1.5 py-0.5 rounded">
              Crítico
            </span>
          )}
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${
            ongoing
              ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          }`}>
            {ongoing ? "En curso" : "Resuelto"}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {dateFmt(inc.started_at)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {formatDurationSec(inc.duration_sec)}
          </span>
          {ongoing && inc.was_paged && (
            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">
              📟 Admin notificado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
