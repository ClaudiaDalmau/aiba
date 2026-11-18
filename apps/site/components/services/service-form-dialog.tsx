"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Sparkles, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api-client";
import type { Service, ServiceInput, ExtraInput } from "@/lib/types";

const DEFAULT: ServiceInput = {
  name: "", description: "", price_eur: 30, deposit_pct: 30, duration_min: 60,
  photo_url: null, info_url: "", max_bookings_per_day: null, active: true, extras: [],
};

export default function ServiceFormDialog({
  open, initial, onClose, onSaved,
}: {
  open: boolean; initial: Service | null; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<ServiceInput>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [defaultsPreloaded, setDefaultsPreloaded] = useState(false);

  useEffect(() => {
    if (open) {
      setDefaultsPreloaded(false);
      if (initial) {
        setForm({
          name: initial.name,
          description: initial.description || "",
          price_eur: initial.price_eur,
          deposit_pct: initial.deposit_pct,
          duration_min: initial.duration_min,
          photo_url: initial.photo_url || null,
          info_url: initial.info_url || "",
          max_bookings_per_day: initial.max_bookings_per_day || null,
          active: initial.active,
          extras: initial.extras.map((e) => ({ extra_id: e.extra_id, name: e.name, price_eur: e.price_eur })),
        });
      } else {
        // Creating a new service — pre-load Default Extras from Settings
        setForm(DEFAULT);
        api<{ default_extras: { name: string; price_eur: number }[] }>("/settings/default-extras")
          .then((r) => {
            const defaults = r.default_extras || [];
            if (defaults.length > 0) {
              setForm((f) => ({
                ...f,
                extras: defaults.map((d) => ({ name: d.name, price_eur: d.price_eur })),
              }));
              setDefaultsPreloaded(true);
            }
          })
          .catch(() => {});
      }
    }
  }, [open, initial]);

  const patch = (k: keyof ServiceInput, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const addExtra = () => setForm((f) => ({ ...f, extras: [...f.extras, { name: "", price_eur: 0 }] }));
  const rmExtra = (idx: number) => setForm((f) => ({ ...f, extras: f.extras.filter((_, i) => i !== idx) }));
  const clearAllExtras = () => {
    if (form.extras.length === 0) return;
    setForm((f) => ({ ...f, extras: [] }));
    setDefaultsPreloaded(false);
    toast.success("Todos los extras eliminados de este servicio");
  };
  const updExtra = (idx: number, k: keyof ExtraInput, v: any) =>
    setForm((f) => ({ ...f, extras: f.extras.map((e, i) => (i === idx ? { ...e, [k]: v } : e)) }));

  const submit = async () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    for (let i = 0; i < form.extras.length; i++) {
      const e = form.extras[i];
      if (!e.name.trim()) { toast.error(`Extra #${i + 1}: falta nombre`); return; }
      if (e.price_eur < 0 || Number.isNaN(e.price_eur)) { toast.error(`Extra “${e.name}”: precio inválido`); return; }
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        info_url: form.info_url?.trim() || null,
        extras: form.extras.map((e) => ({
          ...(e.extra_id ? { extra_id: e.extra_id } : {}),
          name: e.name.trim(),
          price_eur: Number(e.price_eur) || 0,
        })),
      };
      if (initial) await api(`/services/mine/${initial.service_id}`, { method: "PATCH", body: payload });
      else await api("/services/mine", { method: "POST", body: payload });
      toast.success(initial ? "Servicio actualizado" : "Servicio creado");
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const extrasSum = form.extras.reduce((s, e) => s + (Number(e.price_eur) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
          <DialogDescription>Configura precio, duración y extras del servicio.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="svc-name">Nombre</Label>
            <Input id="svc-name" value={form.name} onChange={(e) => patch("name", e.target.value)} placeholder="Consulta general" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="svc-desc">Descripción</Label>
            <textarea
              id="svc-desc" value={form.description || ""} onChange={(e) => patch("description", e.target.value)}
              placeholder="Qué incluye este servicio..." rows={2}
              className="flex w-full rounded-md border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-sm placeholder:text-neutral-400 dark:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label>Precio (€)</Label>
              <Input type="number" step="0.01" value={form.price_eur} onChange={(e) => patch("price_eur", parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Depósito (%)</Label>
              <Input type="number" min={0} max={100} value={form.deposit_pct} onChange={(e) => patch("deposit_pct", Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)))} />
            </div>
            <div className="space-y-2">
              <Label>Duración (h)</Label>
              <Input
                type="number" min={0.08} max={48} step={0.25}
                value={form.duration_min / 60}
                onChange={(e) => {
                  const hours = parseFloat(e.target.value);
                  const min = Number.isNaN(hours) ? 30 : Math.round(hours * 60);
                  patch("duration_min", Math.max(5, Math.min(2880, min)));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Máx/día</Label>
              <Input type="number" min={0} placeholder="Sin límite"
                value={form.max_bookings_per_day ?? ""}
                onChange={(e) => patch("max_bookings_per_day", e.target.value ? parseInt(e.target.value, 10) : null)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="info-url">Info URL (enlace que envía el bot)</Label>
            <Input id="info-url" value={form.info_url || ""} onChange={(e) => patch("info_url", e.target.value)} placeholder="https://tuweb.com/detalle" />
          </div>

          <Separator />

          {/* Extras editor */}
          <div>
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Sparkles className="h-4 w-4 text-violet-600 shrink-0" />
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">Extras (opcional)</h4>
                  {defaultsPreloaded && (
                    <span className="text-[10px] uppercase tracking-wide font-semibold text-violet-700 bg-violet-100 rounded-full px-2 py-0.5">
                      Plantilla cargada
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-0.5">
                  Add-ons que el bot ofrecerá al cliente. Se suman al precio base.
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {form.extras.length > 0 && (
                  <Button type="button" size="sm" variant="ghost" onClick={clearAllExtras} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-3 w-3 mr-1" /> Vaciar todos
                  </Button>
                )}
                <Button type="button" size="sm" onClick={addExtra} variant="outline">
                  <Plus className="h-3 w-3 mr-1" /> Añadir
                </Button>
              </div>
            </div>
            {form.extras.length === 0 ? (
              <p className="text-xs text-neutral-400 dark:text-neutral-500 italic text-center py-3 bg-neutral-50 dark:bg-neutral-900 rounded">
                Sin extras. Pulsa “Añadir” para crear uno.
              </p>
            ) : (
              <div className="space-y-2">
                {form.extras.map((e, idx) => (
                  <div key={e.extra_id || `n-${idx}`} className="flex items-center gap-2">
                    <Input
                      className="flex-1" placeholder="Nombre del extra"
                      value={e.name} onChange={(ev) => updExtra(idx, "name", ev.target.value)}
                    />
                    <Input
                      className="w-24 text-right" type="number" step="0.01" placeholder="+€"
                      value={e.price_eur}
                      onChange={(ev) => updExtra(idx, "price_eur", parseFloat(ev.target.value) || 0)}
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => rmExtra(idx)} className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-right text-violet-700 font-semibold">
                  Suma extras: +{extrasSum.toFixed(2)}€
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex items-center justify-between rounded-md bg-neutral-50 dark:bg-neutral-900 p-3">
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Activo</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">El bot solo ofrece servicios activos.</p>
            </div>
            <Switch checked={form.active} onCheckedChange={(v) => patch("active", v)} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="button" onClick={submit} disabled={saving} className="flex-1">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {initial ? "Guardar" : "Crear"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
