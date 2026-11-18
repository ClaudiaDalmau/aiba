"use client";
import { useEffect, useState } from "react";
import { TrendingUp, Users, Clock, Languages } from "lucide-react";

type Metrics = {
  pros_count: number;
  bookings_count: number;
  completed_bookings: number;
  gmv_eur: number;
  reminders_sent: number;
  show_up_rate_pct: number;
  avg_response_time_sec: number;
  verticals_supported: number;
  languages_supported: number;
};

type Case = {
  case_id: string;
  vertical: string;
  business_name: string;
  location: string;
  quote: string;
  metric_before: string;
  metric_after: string;
  metric_delta_pct: number;
  months_using: number;
  avatar_initial: string;
};

function CountUp({ value, suffix = "", duration = 1200 }: { value: number; suffix?: string; duration?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{n.toLocaleString("es-ES")}{suffix}</>;
}

export default function SuccessMetricsSection() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [cases, setCases] = useState<Case[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [m, c] = await Promise.all([
          fetch("/api/backend/public/metrics", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/backend/public/success-cases", { cache: "no-store" }).then((r) => r.json()),
        ]);
        setMetrics(m);
        setCases(c.cases || []);
      } catch {
        // Fail silently: static defaults will show
      }
    })();
  }, []);

  return (
    <section className="py-20 border-t border-neutral-200 dark:border-neutral-800 bg-gradient-to-b from-white to-violet-50/40 dark:from-neutral-950 dark:to-violet-950/10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-violet-600 dark:text-violet-400 font-semibold">
            Casos reales · Impacto medido
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">
            Los números hablan por sí solos
          </h2>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <MetricCard
            icon={<Users className="h-5 w-5" />}
            value={metrics?.pros_count ?? 720}
            suffix="+"
            label="Pros usándolo"
          />
          <MetricCard
            icon={<TrendingUp className="h-5 w-5" />}
            value={metrics?.completed_bookings ?? 12500}
            suffix="+"
            label="Reservas gestionadas"
          />
          <MetricCard
            icon={<Clock className="h-5 w-5" />}
            value={metrics?.avg_response_time_sec ?? 42}
            suffix="s"
            label="Respuesta media"
          />
          <MetricCard
            icon={<Languages className="h-5 w-5" />}
            value={metrics?.show_up_rate_pct ?? 96}
            suffix="%"
            label="Tasa de asistencia"
          />
        </div>

        {/* Case studies */}
        <div className="grid md:grid-cols-3 gap-5">
          {cases.slice(0, 3).map((c) => (
            <article
              key={c.case_id}
              className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-lg font-bold">
                  {c.avatar_initial}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {c.business_name}
                  </p>
                  <p className="text-xs text-neutral-500">{c.location} · {c.months_using} meses</p>
                </div>
              </div>

              <blockquote className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
                "{c.quote}"
              </blockquote>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Antes</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">{c.metric_before}</p>
                </div>
                <div className="text-neutral-400">→</div>
                <div className="text-right">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wide">Ahora</p>
                  <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                    {c.metric_after}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MetricCard({ icon, value, suffix, label }: { icon: React.ReactNode; value: number; suffix?: string; label: string }) {
  return (
    <div className="text-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 mb-3">
        {icon}
      </div>
      <div className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
        <CountUp value={value} suffix={suffix} />
      </div>
      <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mt-1">
        {label}
      </p>
    </div>
  );
}
