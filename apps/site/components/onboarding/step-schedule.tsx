"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, Calendar } from "lucide-react";

type Interval = { weekday: number; start_min: number; end_min: number };

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DEFAULT_START = 9 * 60;   // 09:00
const DEFAULT_END = 18 * 60;    // 18:00

const PRESETS: { label: string; days: number[]; start: number; end: number }[] = [
  { label: "L-V 9-18",   days: [0, 1, 2, 3, 4], start: 9 * 60,  end: 18 * 60 },
  { label: "L-V 10-20",  days: [0, 1, 2, 3, 4], start: 10 * 60, end: 20 * 60 },
  { label: "L-S 10-14",  days: [0, 1, 2, 3, 4, 5], start: 10 * 60, end: 14 * 60 },
  { label: "L-D flex",   days: [0, 1, 2, 3, 4, 5, 6], start: 11 * 60, end: 21 * 60 },
];

function toHM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
function fromHM(hm: string): number {
  const [h, m] = hm.split(":").map((x) => parseInt(x, 10) || 0);
  return h * 60 + m;
}

export default function StepSchedule({
  initial, onBack, onNext, saving,
}: {
  initial: Interval[] | null;
  onBack: () => void;
  onNext: (intervals: Interval[]) => void;
  saving: boolean;
}) {
  // Per-weekday enabled + hours. Merge multiple intervals per day into a
  // single min-start/max-end for the wizard (advanced editor lives in
  // /agenda later).
  const initialByDay = useMemo(() => {
    const map = new Map<number, { start: number; end: number }>();
    (initial && initial.length ? initial : [{ weekday: 0, start_min: DEFAULT_START, end_min: DEFAULT_END },
                                              { weekday: 1, start_min: DEFAULT_START, end_min: DEFAULT_END },
                                              { weekday: 2, start_min: DEFAULT_START, end_min: DEFAULT_END },
                                              { weekday: 3, start_min: DEFAULT_START, end_min: DEFAULT_END },
                                              { weekday: 4, start_min: DEFAULT_START, end_min: DEFAULT_END }]).forEach((iv) => {
      const prev = map.get(iv.weekday);
      if (!prev) {
        map.set(iv.weekday, { start: iv.start_min, end: iv.end_min });
      } else {
        map.set(iv.weekday, {
          start: Math.min(prev.start, iv.start_min),
          end: Math.max(prev.end, iv.end_min),
        });
      }
    });
    return map;
  }, [initial]);

  const [days, setDays] = useState<{ enabled: boolean; start: number; end: number }[]>(() =>
    DAYS.map((_, i) => {
      const found = initialByDay.get(i);
      return found
        ? { enabled: true, start: found.start, end: found.end }
        : { enabled: false, start: DEFAULT_START, end: DEFAULT_END };
    })
  );
  const [error, setError] = useState<string | null>(null);

  function applyPreset(p: typeof PRESETS[number]) {
    setDays(DAYS.map((_, i) => ({
      enabled: p.days.includes(i),
      start: p.start,
      end: p.end,
    })));
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const intervals: Interval[] = [];
    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      if (!d.enabled) continue;
      if (d.end <= d.start) return setError(`El ${DAYS[i]} tiene un rango inválido (fin ≤ inicio).`);
      intervals.push({ weekday: i, start_min: d.start, end_min: d.end });
    }
    if (!intervals.length) return setError("Marca al menos un día de trabajo.");
    onNext(intervals);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Horario semanal</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
            Marca los días y horas en los que sí atiendes citas.
          </p>
        </div>
      </div>

      {/* Presets */}
      <div>
        <p className="text-xs text-neutral-500 mb-2">Plantillas rápidas:</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p.label}
              onClick={() => applyPreset(p)}
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-medium hover:border-primary hover:bg-primary/5"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Per-day toggles */}
      <div className="space-y-2 rounded-lg border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800">
        {DAYS.map((label, i) => {
          const d = days[i];
          return (
            <div key={label} className="flex items-center gap-3 p-3">
              <label className="flex items-center gap-2 w-24 min-w-[6rem] cursor-pointer">
                <input
                  type="checkbox"
                  checked={d.enabled}
                  onChange={(e) => setDays(days.map((x, idx) => idx === i ? { ...x, enabled: e.target.checked } : x))}
                  className="h-4 w-4 accent-primary"
                  disabled={saving}
                />
                <span className={`text-sm font-medium ${d.enabled ? "" : "text-neutral-400"}`}>{label}</span>
              </label>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="time"
                  step={900}
                  value={toHM(d.start)}
                  onChange={(e) => setDays(days.map((x, idx) => idx === i ? { ...x, start: fromHM(e.target.value) } : x))}
                  disabled={!d.enabled || saving}
                  className="px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm disabled:opacity-40"
                />
                <span className="text-neutral-400">→</span>
                <input
                  type="time"
                  step={900}
                  value={toHM(d.end)}
                  onChange={(e) => setDays(days.map((x, idx) => idx === i ? { ...x, end: fromHM(e.target.value) } : x))}
                  disabled={!d.enabled || saving}
                  className="px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm disabled:opacity-40"
                />
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Button type="button" variant="ghost" onClick={onBack} disabled={saving}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Atrás
        </Button>
        <Button type="submit" disabled={saving} size="lg">
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando…</>
          ) : (
            <>Continuar <ArrowRight className="h-4 w-4 ml-2" /></>
          )}
        </Button>
      </div>
    </form>
  );
}
