"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Coffee } from "lucide-react";
import { toast } from "sonner";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";

/**
 * Iter86 — Recurring weekly time-off blocks editor.
 *
 * Complements the AvailabilityEditor by letting the pro add repeated closures:
 * "todos los martes 12-14h", "domingos cerrado", etc. Backend enforces
 * dedup on (weekday, start, end) so idempotent taps don't spam the list.
 */

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const minToHHMM = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const HHMMtoMin = (s: string) => {
  const [h, m] = s.split(":").map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
};

type RecurringBlock = {
  block_id: string;
  user_id: string;
  weekday: number;
  start_min: number;
  end_min: number;
  reason: string | null;
};

type AvailabilityResp = {
  rules: any[];
  blocks: any[];
  recurring_blocks: RecurringBlock[];
  settings: any;
};

export default function RecurringBlocksEditor() {
  const [items, setItems] = useState<RecurringBlock[] | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    api<AvailabilityResp>("/availability/mine")
      .then((r) => setItems(r.recurring_blocks || []))
      .catch((e) => toast.error(e?.message || "Error"));

  useEffect(() => {
    load();
  }, []);

  const addBlock = async (weekday: number) => {
    // Default: 12:00 – 14:00 (typical lunch pattern). Backend guards against
    // duplicates so multiple taps on the same day → 409 with clear toast.
    try {
      await api("/availability/mine/recurring-blocks", {
        method: "POST",
        body: {
          weekday,
          start_min: 12 * 60,
          end_min: 14 * 60,
          reason: "Comida",
        },
      });
      toast.success("Bloqueo añadido");
      load();
    } catch (e: any) {
      const msg =
        typeof e?.message === "string" && e.message.includes("409")
          ? "Ya tienes un bloqueo idéntico ese día"
          : e?.message || "No se pudo añadir";
      toast.error(msg);
    }
  };

  const updateBlock = async (id: string, patch: Partial<RecurringBlock>) => {
    setSaving(true);
    try {
      const cur = items?.find((b) => b.block_id === id);
      if (!cur) return;
      const body = {
        weekday: cur.weekday,
        start_min: cur.start_min,
        end_min: cur.end_min,
        reason: cur.reason,
        ...patch,
      };
      const upd = await api<RecurringBlock>(
        `/availability/mine/recurring-blocks/${id}`,
        { method: "PATCH", body },
      );
      setItems((cur2) =>
        cur2?.map((b) => (b.block_id === upd.block_id ? upd : b)) || null,
      );
    } catch (e: any) {
      toast.error(e?.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const removeBlock = async (id: string) => {
    try {
      await api(`/availability/mine/recurring-blocks/${id}`, { method: "DELETE" });
      setItems((cur) => cur?.filter((b) => b.block_id !== id) || null);
      toast.success("Bloqueo eliminado");
    } catch (e: any) {
      toast.error(e?.message || "Error");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Coffee className="h-5 w-5 text-amber-600" />
          <div>
            <CardTitle>Bloqueos recurrentes</CardTitle>
            <CardDescription>
              Pausas que se repiten cada semana (comida, cierre semanal, etc.).
              Se restan de tu disponibilidad automáticamente.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {items === null ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Cargando…</p>
        ) : (
          <div className="space-y-3">
            {WEEKDAYS.map((label, wd) => {
              const dayItems = items.filter((b) => b.weekday === wd);
              return (
                <div
                  key={wd}
                  className="flex items-start gap-3 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
                >
                  <p className="w-20 text-sm font-semibold text-neutral-800 dark:text-neutral-200 pt-2">
                    {label}
                  </p>
                  <div className="flex-1 space-y-2">
                    {dayItems.length === 0 ? (
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 italic pt-2">
                        Sin bloqueos
                      </p>
                    ) : (
                      dayItems.map((b) => (
                        <div key={b.block_id} className="flex items-center gap-2 flex-wrap">
                          <Input
                            type="time"
                            defaultValue={minToHHMM(b.start_min)}
                            className="w-28"
                            onBlur={(e) => {
                              const val = HHMMtoMin(e.target.value);
                              if (val !== b.start_min)
                                updateBlock(b.block_id, { start_min: val });
                            }}
                          />
                          <span className="text-neutral-400 dark:text-neutral-500">–</span>
                          <Input
                            type="time"
                            defaultValue={minToHHMM(b.end_min)}
                            className="w-28"
                            onBlur={(e) => {
                              const val = HHMMtoMin(e.target.value);
                              if (val !== b.end_min)
                                updateBlock(b.block_id, { end_min: val });
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="Motivo (opcional)"
                            defaultValue={b.reason || ""}
                            className="w-40 text-sm"
                            maxLength={60}
                            onBlur={(e) => {
                              const val = e.target.value.trim() || null;
                              if (val !== b.reason) updateBlock(b.block_id, { reason: val });
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBlock(b.block_id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addBlock(wd)}>
                    <Plus className="h-3 w-3 mr-1" /> Añadir
                  </Button>
                </div>
              );
            })}
            {saving && (
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Guardando…
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
