"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, Wrench } from "lucide-react";

type ServiceValues = {
  name: string;
  duration_min: number;
  price_eur: number;
  deposit_pct: number;
};

const PRESETS: { icon: string; name: string; duration: number; price: number }[] = [
  { icon: "💇", name: "Corte + peinado",     duration: 60,  price: 35 },
  { icon: "💅", name: "Manicura",             duration: 45,  price: 25 },
  { icon: "🧘", name: "Sesión terapéutica",   duration: 60,  price: 55 },
  { icon: "🏋️", name: "Entrenamiento personal", duration: 60, price: 40 },
  { icon: "🎓", name: "Clase particular",     duration: 60,  price: 30 },
  { icon: "🐕", name: "Paseo con mascotas",   duration: 45,  price: 15 },
];

export default function StepService({
  initial, onBack, onNext, saving,
}: {
  initial: Partial<ServiceValues>;
  onBack: () => void;
  onNext: (v: ServiceValues) => void;
  saving: boolean;
}) {
  const [v, setV] = useState<ServiceValues>({
    name: initial.name || "",
    duration_min: initial.duration_min || 60,
    price_eur: (initial.price_eur ?? 30) as number,
    deposit_pct: (initial.deposit_pct ?? 30) as number,
  });
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!v.name.trim()) return setError("Escribe el nombre del servicio");
    if (v.duration_min < 5 || v.duration_min > 2880) return setError("Duración entre 5 y 2880 min");
    if (v.price_eur < 0) return setError("Precio no puede ser negativo");
    onNext({ ...v, name: v.name.trim() });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Wrench className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Primer servicio</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
            Empieza con uno. Podrás añadir más servicios desde el dashboard.
          </p>
        </div>
      </div>

      {/* Preset chips */}
      <div>
        <p className="text-xs text-neutral-500 mb-2">Plantillas rápidas:</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p.name}
              onClick={() =>
                setV({
                  name: p.name,
                  duration_min: p.duration,
                  price_eur: p.price,
                  deposit_pct: v.deposit_pct,
                })
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-medium hover:border-primary hover:bg-primary/5"
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="s-name">Nombre del servicio</Label>
          <Input
            id="s-name"
            value={v.name}
            onChange={(e) => setV({ ...v, name: e.target.value })}
            placeholder="Corte + peinado"
            disabled={saving}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="s-dur">Duración (min)</Label>
            <Input
              id="s-dur"
              type="number"
              min={5}
              max={2880}
              step={5}
              value={v.duration_min}
              onChange={(e) => setV({ ...v, duration_min: Math.max(5, parseInt(e.target.value || "0", 10)) })}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="s-price">Precio (€)</Label>
            <Input
              id="s-price"
              type="number"
              min={0}
              step={1}
              value={v.price_eur}
              onChange={(e) => setV({ ...v, price_eur: Math.max(0, parseFloat(e.target.value || "0")) })}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="s-dep">Anticipo (%)</Label>
            <Input
              id="s-dep"
              type="number"
              min={0}
              max={100}
              step={5}
              value={v.deposit_pct}
              onChange={(e) => setV({ ...v, deposit_pct: Math.min(100, Math.max(0, parseInt(e.target.value || "0", 10))) })}
              disabled={saving}
            />
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          El anticipo se cobra al confirmar la reserva; el resto al llegar. Un{" "}
          <span className="font-semibold">30%</span> reduce los no-shows en más de un 60%.
        </p>
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
