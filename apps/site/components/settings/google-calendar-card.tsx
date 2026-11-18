"use client";
/**
 * GoogleCalendarCard — Iter57 Fase 2.3.
 *
 * Multi-calendar bidirectional sync with Google Calendar.
 *
 * Flow:
 *   1. Show connection status. If disconnected → "Conectar Google Calendar" opens
 *      the consent screen in a new tab and polls /google/status until connected.
 *   2. When connected: show a list of the pro's calendars with:
 *      - a checkbox per calendar (which calendars to READ for busy events)
 *      - a radio to pick which calendar is the WRITE target for AIB bookings
 *      - a global sync toggle
 *      - "Disconnect" button
 *   3. Recent conflicts (Google event ↔ AIB booking overlaps) shown as an alert.
 */
import { useCallback, useEffect, useState } from "react";
import { Calendar, Link2, Link2Off, RefreshCw, AlertTriangle, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";

type Status = {
  configured: boolean;
  connected: boolean;
  sync_enabled: boolean;
  connected_at: string | null;
  status: string;
  calendar_id: string | null;
};

type Cal = {
  id: string;
  summary: string;
  primary: boolean;
  access_role: string | null;
  background_color: string | null;
  foreground_color: string | null;
  time_zone: string | null;
  selected: boolean;
  is_write_target: boolean;
  can_write: boolean;
};

type Conflict = {
  booking_id: string;
  google_event_summary: string;
  google_event_start: string;
  google_event_end: string;
  booking_start: string;
  booking_end: string;
  dismissed: boolean;
};

export default function GoogleCalendarCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [calendars, setCalendars] = useState<Cal[] | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const s = await api<Status>("/google/status");
      setStatus(s);
      return s;
    } catch {
      return null;
    }
  }, []);

  const loadCalendars = useCallback(async () => {
    try {
      const { calendars } = await api<{ calendars: Cal[] }>("/google/calendars");
      setCalendars(calendars);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Silent unless not-connected error (expected when disconnected).
      if (!msg.includes("google_not_connected")) toast.error(msg);
    }
  }, []);

  const loadConflicts = useCallback(async () => {
    try {
      const { conflicts } = await api<{ conflicts: Conflict[] }>("/google/conflicts?limit=10");
      setConflicts(conflicts || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    (async () => {
      const s = await loadStatus();
      if (s?.connected) {
        await Promise.all([loadCalendars(), loadConflicts()]);
      }
    })();
  }, [loadStatus, loadCalendars, loadConflicts]);

  // Poll status when the tab regains focus (after returning from Google consent).
  useEffect(() => {
    const onVis = async () => {
      if (document.visibilityState === "visible") {
        const s = await loadStatus();
        if (s?.connected) {
          await Promise.all([loadCalendars(), loadConflicts()]);
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [loadStatus, loadCalendars, loadConflicts]);

  const connect = async () => {
    if (!status?.configured) {
      toast.error("Google Calendar no está configurado en el servidor.");
      return;
    }
    setConnecting(true);
    try {
      const { authorization_url } = await api<{ authorization_url: string }>("/google/start");
      window.open(authorization_url, "_blank", "noopener,noreferrer");
      toast.info("Se abrió la pantalla de consentimiento de Google en una nueva pestaña.");
      // Poll status every 3 seconds up to 2 minutes.
      const started = Date.now();
      const poll = async () => {
        if (Date.now() - started > 120_000) {
          setConnecting(false);
          return;
        }
        const s = await loadStatus();
        if (s?.connected) {
          toast.success("¡Google Calendar conectado!");
          await Promise.all([loadCalendars(), loadConflicts()]);
          setConnecting(false);
          return;
        }
        setTimeout(poll, 3000);
      };
      setTimeout(poll, 3000);
    } catch (err: unknown) {
      setConnecting(false);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    }
  };

  const disconnect = async () => {
    if (!confirm("¿Seguro que quieres desconectar Google Calendar? Se borrarán los enlaces con eventos existentes.")) return;
    setSaving(true);
    try {
      await api("/google/connection", { method: "DELETE" });
      toast.success("Google Calendar desconectado.");
      setCalendars(null);
      setConflicts([]);
      await loadStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleSync = async (v: boolean) => {
    const prev = status;
    if (prev) setStatus({ ...prev, sync_enabled: v });
    setSaving(true);
    try {
      await api("/google/sync/toggle", { method: "POST", body: { enabled: v } });
      toast.success(v ? "Sincronización activada" : "Sincronización pausada");
    } catch (err: unknown) {
      if (prev) setStatus(prev);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleCalendar = (id: string, next: boolean) => {
    if (!calendars) return;
    setCalendars((prev) => prev?.map((c) => (c.id === id ? { ...c, selected: next } : c)) || null);
  };

  const setWriteCalendar = (id: string) => {
    if (!calendars) return;
    setCalendars((prev) => prev?.map((c) => ({ ...c, is_write_target: c.id === id })) || null);
  };

  const saveSelection = async () => {
    if (!calendars) return;
    const selected = calendars.filter((c) => c.selected).map((c) => c.id);
    if (selected.length === 0) {
      toast.error("Debes seleccionar al menos un calendario.");
      return;
    }
    const writeTarget = calendars.find((c) => c.is_write_target && c.selected);
    if (!writeTarget) {
      toast.error("Debes elegir un calendario donde crear las citas AIB.");
      return;
    }
    if (!writeTarget.can_write) {
      toast.error("El calendario elegido para escribir no tiene permisos de escritura.");
      return;
    }
    setSaving(true);
    try {
      await api("/google/calendars/selection", {
        method: "PUT",
        body: {
          selected_calendar_ids: selected,
          write_calendar_id: writeTarget.id,
        },
      });
      toast.success("Selección guardada. La próxima sincronización ya usará los cambios.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const forceRefresh = async () => {
    setSaving(true);
    try {
      await api("/google/sync/refresh", { method: "POST" });
      toast.success("Caché de disponibilidad limpiada.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const dismissConflict = async (bookingId: string) => {
    try {
      await api(`/google/conflicts/${bookingId}/dismiss`, { method: "POST" });
      setConflicts((prev) => prev.filter((c) => c.booking_id !== bookingId));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <CardTitle>Google Calendar</CardTitle>
            <CardDescription>
              Sincronización bidireccional: tus citas AIB aparecen en Google Calendar y tus eventos personales bloquean huecos automáticamente.
            </CardDescription>
          </div>
          {status?.connected && (
            <Badge className="bg-emerald-100 text-emerald-700">Conectado</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!status ? (
          <Skeleton className="h-32" />
        ) : !status.connected ? (
          <div className="rounded-md border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-3 items-start">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Conecta tu Google Calendar para que las reservas AIB aparezcan automáticamente en tu agenda personal y para que los eventos que tengas en Google (dentista, gimnasio, etc.) bloqueen huecos en la app.
            </p>
            <Button onClick={connect} disabled={connecting || !status.configured}>
              <Link2 className="h-4 w-4" />
              {connecting ? "Esperando consentimiento…" : "Conectar Google Calendar"}
            </Button>
            {!status.configured && (
              <p className="text-xs text-red-600">
                El servidor aún no tiene configuradas las credenciales OAuth de Google.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Global sync toggle */}
            <div className="flex items-center justify-between rounded-md border border-neutral-200 dark:border-neutral-800 p-3">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-semibold">
                  Sincronización {status.sync_enabled ? "activa" : "pausada"}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Al pausarla, tus reservas AIB dejan de enviarse a Google y los eventos externos dejan de bloquear huecos.
                </p>
              </div>
              <Switch checked={status.sync_enabled} onCheckedChange={toggleSync} disabled={saving} />
            </div>

            {/* Calendar picker */}
            <div className="rounded-md border border-neutral-200 dark:border-neutral-800 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Calendarios a sincronizar</p>
                <Button size="sm" variant="outline" onClick={() => loadCalendars()} disabled={saving}>
                  <RefreshCw className="h-3 w-3" /> Recargar
                </Button>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                Marca los calendarios cuyos eventos deben bloquear tu disponibilidad, y elige uno como destino para las citas AIB.
              </p>

              {!calendars ? (
                <Skeleton className="h-40" />
              ) : calendars.length === 0 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">No se encontraron calendarios.</p>
              ) : (
                <ul className="space-y-1.5">
                  {calendars.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 rounded-md border border-neutral-100 dark:border-neutral-900 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                    >
                      <input
                        type="checkbox"
                        checked={c.selected}
                        onChange={(e) => toggleCalendar(c.id, e.target.checked)}
                        className="h-4 w-4 accent-blue-600"
                        aria-label={`Sincronizar ${c.summary}`}
                      />
                      <span
                        className="h-3 w-3 rounded-sm shrink-0"
                        style={{ background: c.background_color || "#9CA3AF" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.summary}</p>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          {c.primary ? "Principal · " : ""}
                          {c.access_role || "reader"}
                          {c.time_zone ? ` · ${c.time_zone}` : ""}
                        </p>
                      </div>
                      <label className="flex items-center gap-1 text-xs cursor-pointer" title={c.can_write ? "Usar este calendario para las citas AIB" : "Este calendario no permite escritura"}>
                        <input
                          type="radio"
                          name="write_target"
                          checked={c.is_write_target}
                          onChange={() => setWriteCalendar(c.id)}
                          disabled={!c.can_write || !c.selected}
                          className="accent-blue-600"
                        />
                        <span className={c.can_write ? "text-neutral-600 dark:text-neutral-300" : "text-neutral-400 dark:text-neutral-600"}>
                          Escribir aquí
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" onClick={saveSelection} disabled={saving || !calendars}>
                  <Check className="h-4 w-4" /> Guardar selección
                </Button>
                <Button size="sm" variant="outline" onClick={forceRefresh} disabled={saving}>
                  <RefreshCw className="h-4 w-4" /> Forzar sincronización
                </Button>
                <Button size="sm" variant="outline" onClick={disconnect} disabled={saving} className="text-red-600 hover:text-red-700 ml-auto">
                  <Link2Off className="h-4 w-4" /> Desconectar
                </Button>
              </div>
            </div>

            {/* Conflicts */}
            {conflicts.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    {conflicts.length} conflicto{conflicts.length !== 1 ? "s" : ""} detectado{conflicts.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Un evento en tu Google Calendar coincide con una cita AIB. No hemos cancelado nada — revisa y decide.
                </p>
                <ul className="space-y-1">
                  {conflicts.map((c) => {
                    const gs = new Date(c.google_event_start).toLocaleString();
                    const bs = new Date(c.booking_start).toLocaleString();
                    return (
                      <li
                        key={`${c.booking_id}-${c.google_event_summary}`}
                        className="flex items-start gap-2 rounded bg-white dark:bg-neutral-900 border border-amber-100 dark:border-amber-900/50 p-2"
                      >
                        <ExternalLink className="h-3 w-3 text-amber-600 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-semibold truncate">{c.google_event_summary}</p>
                          <p className="text-neutral-500 dark:text-neutral-400">
                            Google: {gs} → AIB: {bs}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => dismissConflict(c.booking_id)}>
                          Descartar
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
