"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Save, X, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

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
  order: number;
  is_published: boolean;
};

type Form = Omit<Case, "case_id">;

const EMPTY: Form = {
  vertical: "beauty",
  business_name: "",
  location: "",
  quote: "",
  metric_before: "",
  metric_after: "",
  metric_delta_pct: 0,
  months_using: 3,
  avatar_initial: "A",
  order: 999,
  is_published: true,
};

export default function AdminCasesClient() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function reload() {
    try {
      const { cases } = await api<{ cases: Case[] }>("/admin/cases");
      setCases(cases || []);
    } catch (e: any) {
      toast.error(e?.message || "No se pudieron cargar los casos");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { reload(); }, []);

  function startNew() {
    setForm({ ...EMPTY, order: cases.length + 1 });
    setEditing("new");
  }
  function startEdit(c: Case) {
    setForm({
      vertical: c.vertical, business_name: c.business_name, location: c.location,
      quote: c.quote, metric_before: c.metric_before, metric_after: c.metric_after,
      metric_delta_pct: c.metric_delta_pct, months_using: c.months_using,
      avatar_initial: c.avatar_initial, order: c.order, is_published: c.is_published,
    });
    setEditing(c.case_id);
  }

  async function save() {
    setSaving(true);
    try {
      if (editing === "new") {
        await api("/admin/cases", { method: "POST", body: form });
        toast.success("Caso creado");
      } else if (editing) {
        await api(`/admin/cases/${editing}`, { method: "PUT", body: form });
        toast.success("Caso actualizado");
      }
      setEditing(null);
      await reload();
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este caso permanentemente?")) return;
    try {
      await api(`/admin/cases/${id}`, { method: "DELETE" });
      toast.success("Caso eliminado");
      await reload();
    } catch (e: any) {
      toast.error(e?.message || "Error al eliminar");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-3">
            <Star className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Casos de éxito</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              Los cases que aparecen en la landing. La caché se refresca al guardar.
            </p>
          </div>
        </div>
        {editing == null && (
          <Button onClick={startNew}>
            <Plus className="h-4 w-4 mr-1.5" /> Nuevo caso
          </Button>
        )}
      </div>

      {editing != null && (
        <Card>
          <CardHeader>
            <CardTitle>{editing === "new" ? "Nuevo caso" : `Editar ${editing}`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre del negocio</Label>
                <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Ubicación</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Madrid" />
              </div>
              <div className="space-y-1.5">
                <Label>Vertical</Label>
                <select
                  value={form.vertical}
                  onChange={(e) => setForm({ ...form, vertical: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm"
                >
                  {["beauty", "wellness", "fitness", "health", "education", "pets", "other"].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Inicial del avatar</Label>
                <Input
                  value={form.avatar_initial}
                  onChange={(e) => setForm({ ...form, avatar_initial: e.target.value.slice(0, 2).toUpperCase() })}
                  className="uppercase font-bold"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Testimonio (10-600 caracteres)</Label>
              <textarea
                rows={3}
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm resize-y"
              />
              <p className="text-xs text-neutral-500">{form.quote.length} / 600</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Métrica antes</Label>
                <Input value={form.metric_before} onChange={(e) => setForm({ ...form, metric_before: e.target.value })} placeholder="68% ocupación" />
              </div>
              <div className="space-y-1.5">
                <Label>Métrica después</Label>
                <Input value={form.metric_after} onChange={(e) => setForm({ ...form, metric_after: e.target.value })} placeholder="94% ocupación" />
              </div>
              <div className="space-y-1.5">
                <Label>Delta (%)</Label>
                <Input
                  type="number"
                  value={form.metric_delta_pct}
                  onChange={(e) => setForm({ ...form, metric_delta_pct: parseInt(e.target.value || "0", 10) })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Meses usándolo</Label>
                <Input
                  type="number"
                  value={form.months_using}
                  onChange={(e) => setForm({ ...form, months_using: parseInt(e.target.value || "0", 10) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Orden en la landing</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value || "0", 10) })}
                />
              </div>
              <div className="space-y-1.5 flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">Publicado</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
                <X className="h-4 w-4 mr-1.5" /> Cancelar
              </Button>
              <Button onClick={save} disabled={saving || !form.business_name || !form.quote}>
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando…</>
                ) : (
                  <><Save className="h-4 w-4 mr-1.5" /> Guardar</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cases list */}
      {cases.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-neutral-500 text-sm">
            No hay casos personalizados aún — la landing usa los 3 seeds por defecto (Estudio Isabel, Ana Terapias, Carlos PT). Crea uno para reemplazarlos.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {cases.map((c) => (
            <Card key={c.case_id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {c.avatar_initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold truncate">{c.business_name}</p>
                      <Badge variant="outline" className="text-[10px]">{c.vertical}</Badge>
                      {c.is_published ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">Publicado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Oculto</Badge>
                      )}
                      <span className="text-[10px] text-neutral-500">orden {c.order}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mb-2">{c.location} · {c.months_using} meses</p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 italic line-clamp-2">"{c.quote}"</p>
                    <div className="mt-2 text-xs text-neutral-500">
                      <span className="line-through">{c.metric_before}</span>
                      {" → "}
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{c.metric_after}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(c.case_id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
