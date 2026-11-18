"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, Store } from "lucide-react";

type BusinessValues = {
  business_name: string;
  timezone: string;
  currency: string;
  phone: string;
};

export default function StepBusiness({
  initial, meta, onBack, onNext, saving,
}: {
  initial: BusinessValues;
  meta: { supported_timezones: string[]; supported_currencies: string[] };
  onBack: () => void;
  onNext: (v: BusinessValues) => void;
  saving: boolean;
}) {
  const [v, setV] = useState<BusinessValues>(initial);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!v.business_name.trim()) return setError("Escribe el nombre de tu negocio");
    if (v.phone && !/^\+?[0-9\s-]{6,25}$/.test(v.phone.trim())) {
      return setError("Teléfono inválido (formato +34…)");
    }
    onNext({
      business_name: v.business_name.trim(),
      timezone: v.timezone,
      currency: v.currency.toUpperCase(),
      phone: v.phone.trim() || "",
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Store className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tu negocio</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
            Este nombre aparecerá en tu página de reservas y en los mensajes a clientes.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ob-name">Nombre público del negocio</Label>
          <Input
            id="ob-name"
            value={v.business_name}
            onChange={(e) => setV({ ...v, business_name: e.target.value })}
            placeholder="Estudio Ana Pérez"
            disabled={saving}
            autoFocus
            required
          />
          <p className="text-xs text-neutral-500">
            Recomendado: nombre + apellido, marca de estudio, o cómo te conocen tus clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ob-tz">Zona horaria</Label>
            <select
              id="ob-tz"
              value={v.timezone}
              onChange={(e) => setV({ ...v, timezone: e.target.value })}
              disabled={saving}
              className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:ring-2 focus:ring-primary/40 outline-none"
            >
              {meta.supported_timezones.map((tz) => (
                <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ob-cur">Moneda</Label>
            <select
              id="ob-cur"
              value={v.currency}
              onChange={(e) => setV({ ...v, currency: e.target.value })}
              disabled={saving}
              className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:ring-2 focus:ring-primary/40 outline-none"
            >
              {meta.supported_currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ob-phone">Teléfono (opcional)</Label>
          <Input
            id="ob-phone"
            value={v.phone}
            onChange={(e) => setV({ ...v, phone: e.target.value })}
            placeholder="+34 600 123 456"
            disabled={saving}
          />
          <p className="text-xs text-neutral-500">
            Solo se comparte si conectas WhatsApp. No se muestra públicamente por defecto.
          </p>
        </div>
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
