"use client";
/**
 * EmailRemindersCard — Iter56 P2 Fase 2.1.
 *
 * Compact settings card that lets a pro toggle email reminders globally.
 * When enabled, the reminders worker (Pass E) sends a T-24h email to every
 * confirmed booking whose client has an email + opted-in on their own.
 *
 * Uses shadcn's Switch — matches the visual style of the other toggles in
 * `settings-client.tsx` (Manual review, etc.).
 */
import { useCallback, useEffect, useState } from "react";
import { Mail, Info } from "lucide-react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";

type State = { email_reminders_enabled: boolean };

export default function EmailRemindersCard() {
  const [state, setState] = useState<State | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api<State>("/settings/email-reminders");
      setState(res);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (v: boolean) => {
    const prev = state;
    // Optimistic — the toggle should feel instant.
    setState({ email_reminders_enabled: v });
    setSaving(true);
    try {
      await api("/settings/email-reminders", {
        method: "PATCH",
        body: { email_reminders_enabled: v },
      });
      toast.success(
        v
          ? "Recordatorios por email activados"
          : "Recordatorios por email desactivados",
        {
          description: v
            ? "Enviaremos un recordatorio 24h antes de cada cita a los clientes con email."
            : "No enviaremos emails de recordatorio hasta que lo vuelvas a activar.",
        },
      );
    } catch (err: unknown) {
      // Rollback on error
      setState(prev);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`No se pudo guardar: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-violet-600" />
          <div>
            <CardTitle>Recordatorios por email</CardTitle>
            <CardDescription>
              Además del recordatorio por Telegram T-1h, envía un email 24h antes
              a los clientes que tengan email guardado en su ficha.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!state ? (
          <Skeleton className="h-9" />
        ) : (
          <div className="flex items-center justify-between rounded-md border border-neutral-200 dark:border-neutral-800 p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {state.email_reminders_enabled ? "Activados" : "Desactivados"}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Los clientes también pueden desactivar sus recordatorios individualmente desde su ficha.
                </span>
              </p>
            </div>
            <Switch
              checked={state.email_reminders_enabled}
              onCheckedChange={toggle}
              disabled={saving}
              data-testid="email-reminders-toggle"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
