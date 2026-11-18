"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Sparkles, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";

type DefaultExtra = { name: string; price_eur: number };

export default function DefaultExtrasCard() {
  const [items, setItems] = useState<DefaultExtra[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = () =>
    api<{ default_extras: DefaultExtra[] }>("/settings/default-extras")
      .then((r) => { setItems(r.default_extras || []); setDirty(false); })
      .catch((e) => toast.error(e.message));

  useEffect(() => { load(); }, []);

  const add = () => { setItems((cur) => [...(cur || []), { name: "", price_eur: 0 }]); setDirty(true); };
  const remove = (idx: number) => { setItems((cur) => cur?.filter((_, i) => i !== idx) || null); setDirty(true); };
  const update = (idx: number, k: keyof DefaultExtra, v: any) => {
    setItems((cur) => cur?.map((e, i) => (i === idx ? { ...e, [k]: v } : e)) || null);
    setDirty(true);
  };

  const save = async () => {
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const e = items[i];
      if (!e.name.trim()) { toast.error(`Extra #${i + 1}: falta nombre`); return; }
      if (e.price_eur < 0 || Number.isNaN(e.price_eur)) { toast.error(`Extra “${e.name}”: precio inválido`); return; }
    }
    setSaving(true);
    try {
      await api("/settings/default-extras", {
        method: "PATCH",
        body: {
          default_extras: items.map((e) => ({ name: e.name.trim(), price_eur: Number(e.price_eur) || 0 })),
        },
      });
      toast.success("Defaults actualizados. Se aplicarán a nuevos servicios.");
      setDirty(false);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const total = (items || []).reduce((s, e) => s + (Number(e.price_eur) || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-600" />
          <div className="flex-1">
            <CardTitle>Extras por defecto</CardTitle>
            <CardDescription>
              Plantilla que se pre-cargará al crear cada nuevo servicio. No afecta a los existentes.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={add} type="button">
            <Plus className="h-3 w-3 mr-1" /> Añadir
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items === null ? (
          <Skeleton className="h-24" />
        ) : items.length === 0 ? (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 italic text-center py-6 bg-neutral-50 dark:bg-neutral-900 rounded">
            Sin extras por defecto. Al añadir alguno, cada nuevo servicio empezará con esas opciones.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((e, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  className="flex-1" placeholder="Nombre del extra"
                  value={e.name} onChange={(ev) => update(idx, "name", ev.target.value)}
                />
                <Input
                  className="w-24 text-right" type="number" step="0.01" placeholder="+€"
                  value={e.price_eur}
                  onChange={(ev) => update(idx, "price_eur", parseFloat(ev.target.value) || 0)}
                />
                <Button variant="ghost" size="sm" onClick={() => remove(idx)} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">{items.length} extra{items.length !== 1 ? "s" : ""}</p>
              <p className="text-xs font-semibold text-violet-700">Suma: +{total.toFixed(2)}€</p>
            </div>
          </div>
        )}
        {items !== null && (
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={save} disabled={saving || !dirty}>
              {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              Guardar plantilla
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
