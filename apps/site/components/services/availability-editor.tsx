"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const minToHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const HHMMtoMin = (s: string) => {
  const [h, m] = s.split(":").map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
};

type Rule = { rule_id: string; user_id: string; weekday: number; start_min: number; end_min: number };
type AvailabilityResp = { rules: Rule[]; blocks: any[]; settings: any };

export default function AvailabilityEditor() {
  const [slots, setSlots] = useState<Rule[] | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    api<AvailabilityResp>("/availability/mine")
      .then((r) => setSlots(r.rules || []))
      .catch((e) => toast.error(e.message));
  useEffect(() => { load(); }, []);

  const addSlot = async (weekday: number) => {
    try {
      await api("/availability/mine/rules", { method: "POST", body: { weekday, start_min: 9 * 60, end_min: 18 * 60 } });
      toast.success("Franja añadida");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const updateSlot = async (id: string, patch: Partial<Rule>) => {
    setSaving(true);
    try {
      const s = slots?.find((x) => x.rule_id === id);
      if (!s) return;
      const body = { weekday: s.weekday, start_min: s.start_min, end_min: s.end_min, ...patch };
      const upd = await api<Rule>(`/availability/mine/rules/${id}`, { method: "PATCH", body });
      setSlots((cur) => cur?.map((r) => (r.rule_id === upd.rule_id ? upd : r)) || null);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const removeSlot = async (id: string) => {
    try {
      await api(`/availability/mine/rules/${id}`, { method: "DELETE" });
      setSlots((cur) => cur?.filter((s) => s.rule_id !== id) || null);
      toast.success("Franja eliminada");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-violet-600" />
          <div>
            <CardTitle>Disponibilidad semanal</CardTitle>
            <CardDescription>Franjas horarias en las que el bot puede reservar.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {slots === null ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">Cargando…</p>
        ) : (
          <div className="space-y-3">
            {WEEKDAYS.map((label, wd) => {
              const daySlots = slots.filter((s) => s.weekday === wd);
              return (
                <div key={wd} className="flex items-start gap-3 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0">
                  <p className="w-20 text-sm font-semibold text-neutral-800 dark:text-neutral-200 pt-2">{label}</p>
                  <div className="flex-1 space-y-2">
                    {daySlots.length === 0 ? (
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 italic pt-2">Sin disponibilidad</p>
                    ) : daySlots.map((s) => (
                      <div key={s.rule_id} className="flex items-center gap-2">
                        <Input
                          type="time" defaultValue={minToHHMM(s.start_min)}
                          className="w-28"
                          onBlur={(e) => {
                            const val = HHMMtoMin(e.target.value);
                            if (val !== s.start_min) updateSlot(s.rule_id, { start_min: val });
                          }}
                        />
                        <span className="text-neutral-400 dark:text-neutral-500">–</span>
                        <Input
                          type="time" defaultValue={minToHHMM(s.end_min)}
                          className="w-28"
                          onBlur={(e) => {
                            const val = HHMMtoMin(e.target.value);
                            if (val !== s.end_min) updateSlot(s.rule_id, { end_min: val });
                          }}
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeSlot(s.rule_id)} className="text-red-600">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addSlot(wd)}>
                    <Plus className="h-3 w-3 mr-1" /> Franja
                  </Button>
                </div>
              );
            })}
            {saving && (
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">
                <Loader2 className="h-3 w-3 animate-spin" /> Guardando...
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
