"use client";
import { useEffect, useState } from "react";
import { Calendar, Clock, User, MessageCircle, CheckCircle2, XCircle, Star, Loader2, RefreshCw, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/lib/api-client";
import { fmtEur, fmtDuration } from "@/lib/format";

type Today = {
  booking_id: string;
  scheduled_at: string;
  duration_min: number;
  status: string;
  cancellation_type?: string | null;
  rated_at?: string | null;
  price_eur: number;
  deposit_eur: number;
  remaining_eur: number;
  verification_code: string;
  code_used: boolean;
  client_confirmed_at?: string | null;
  reminder_sent_at?: string | null;
  service_name: string;
  client_name: string;
  client_telegram_id?: number | null;
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending_deposit: { label: "Pdte. depósito", className: "bg-amber-100 text-amber-800" },
  confirmed:       { label: "Confirmada",     className: "bg-emerald-100 text-emerald-800" },
  reminder_sent:   { label: "Recordatorio",   className: "bg-blue-100 text-blue-800" },
  in_progress:     { label: "En curso",       className: "bg-violet-100 text-violet-800" },
  completed:       { label: "Completada",     className: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300" },
  cancelled:       { label: "Cancelada",      className: "bg-red-100 text-red-800" },
  no_show:         { label: "No show",        className: "bg-red-100 text-red-800" },
};

export default function AgendaClient() {
  const [items, setItems] = useState<Today[] | null>(null);
  const [selected, setSelected] = useState<Today | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try { setItems(await api<Today[]>("/bookings/mine/today")); }
    catch (e: any) { toast.error(e.message); }
    finally { setRefreshing(false); }
  };
  useEffect(() => { load(); }, []);

  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const r = await fetch("/api/backend/exports/bookings.csv", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      let filename = "bookings.csv";
      const cd = r.headers.get("content-disposition");
      const m = cd && /filename="?([^"]+)"?/.exec(cd);
      if (m) filename = m[1];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success("CSV descargado");
    } catch (e: any) {
      toast.error(e.message || "Error al descargar");
    } finally {
      setDownloading(false);
    }
  };

  const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">Módulo 5</p>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Agenda de hoy</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-1 capitalize">{today}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadCsv} disabled={downloading}>
            {downloading
              ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              : <Download className="h-4 w-4 mr-1" />}
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={load} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {items === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Calendar className="h-10 w-10 mx-auto text-neutral-300" />
            <p className="font-semibold text-neutral-900 dark:text-neutral-100 mt-3">Sin citas hoy</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-1">Cuando el bot agende una nueva reserva, aparecerá aquí.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <BookingRow key={b.booking_id} booking={b} onOpen={() => setSelected(b)} />
          ))}
        </div>
      )}

      <BookingDialog
        booking={selected}
        onClose={() => setSelected(null)}
        onChanged={() => { load(); setSelected(null); }}
      />
    </div>
  );
}

function BookingRow({ booking, onOpen }: { booking: Today; onOpen: () => void }) {
  const time = new Date(booking.scheduled_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const meta = STATUS_META[booking.status] || { label: booking.status, className: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300" };
  const needsAction = booking.status === "reminder_sent" && booking.client_confirmed_at;

  return (
    <Card className={`transition hover:shadow-md cursor-pointer ${needsAction ? "ring-1 ring-violet-300" : ""}`} onClick={onOpen}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="text-center shrink-0">
          <p className="text-lg font-bold text-violet-700">{time}</p>
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">{fmtDuration(booking.duration_min)}</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{booking.service_name}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 truncate flex items-center gap-1">
            <User className="h-3 w-3" /> {booking.client_name}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-neutral-900 dark:text-neutral-100">{fmtEur(booking.price_eur)}</p>
          <Badge className={`text-[10px] ${meta.className}`}>{meta.label}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingDialog({
  booking, onClose, onChanged,
}: { booking: Today | null; onClose: () => void; onChanged: () => void }) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  useEffect(() => {
    setCode("");
    setShowConfirmCancel(false);
  }, [booking?.booking_id]);

  const verify = async () => {
    if (!booking) return;
    if (code.length < 4) { toast.error("Código demasiado corto"); return; }
    setSubmitting(true);
    try {
      const res = await api<{ ok: boolean; captured_eur: number; booking_status: string }>(
        `/bookings/${booking.booking_id}/verify-code`,
        { method: "POST", body: { code: code.trim() } },
      );
      toast.success(`Cita completada · capturado ${fmtEur(res.captured_eur)}`);
      onChanged();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  const emergencyCancel = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      await api(`/bookings/${booking.booking_id}/cancel-by-pro`, {
        method: "POST",
        body: { reason: "Cancelación de emergencia desde agenda" },
      });
      toast.success("Cita cancelada. El cliente ha sido notificado.");
      onChanged();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCancelling(false);
      setShowConfirmCancel(false);
    }
  };

  if (!booking) return null;
  const time = new Date(booking.scheduled_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const meta = STATUS_META[booking.status] || { label: booking.status, className: "" };
  const canVerify = booking.status === "reminder_sent" && booking.client_confirmed_at && !booking.code_used;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{booking.service_name}</DialogTitle>
          <DialogDescription>
            {time} · {fmtDuration(booking.duration_min)} · {booking.client_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className={meta.className}>{meta.label}</Badge>
            {booking.client_confirmed_at && (
              <Badge className="bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Confirmada por cliente
              </Badge>
            )}
            {booking.rated_at && (
              <Badge className="bg-amber-100 text-amber-700">
                <Star className="h-3 w-3 mr-1" /> Puntuada
              </Badge>
            )}
          </div>

          <div className="grid-cols-3 gap-2 text-sm">
            <Info label="Precio" value={fmtEur(booking.price_eur)} />
            <Info label="Depósito" value={fmtEur(booking.deposit_eur)} />
            <Info label="Restante" value={fmtEur(booking.remaining_eur)} />
          </div>

          {canVerify ? (
            <div className="space-y-2 rounded-lg border-violet-200 bg-violet-50 p-3">
              <p className="text-sm font-semibold text-violet-900">Verificar código del cliente</p>
              <p className="text-xs text-violet-700">El cliente recibió un código de 6 dígitos al confirmar.</p>
              <div className="flex gap-2">
                <Input
                  value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456" inputMode="numeric" maxLength={6}
                  className="font-mono text-lg tracking-widest text-center"
                />
                <Button onClick={verify} disabled={submitting || code.length < 4}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
                </Button>
              </div>
            </div>
          ) : booking.code_used ? (
            <p className="text-xs text-emerald-700 bg-emerald-50 rounded p-3">
              <CheckCircle2 className="h-3 w-3 inline mr-1" /> Código ya verificado.
            </p>
          ) : (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">
              Podrás introducir el código cuando el cliente confirme el recordatorio (T-1h antes de la cita).
            </p>
          )}

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 space-y-1">
            {booking.reminder_sent_at && (
              <p>Recordatorio enviado: {new Date(booking.reminder_sent_at).toLocaleTimeString("es-ES")}</p>
            )}
            {booking.client_telegram_id && (
              <p className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> Telegram ID: {booking.client_telegram_id}
              </p>
            )}
          </div>

          {/* Emergency cancel — always visible except for terminal states */}
          {!["cancelled", "completed", "no_show", "cancelled_by_pro", "refunded"].includes(booking.status) && (
            <div className="pt-3 border-t border-red-100 dark:border-red-950/50">
              {!showConfirmCancel ? (
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  onClick={() => setShowConfirmCancel(true)}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Cancelación de emergencia
                </Button>
              ) : (
                <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 p-3 space-y-3">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                    ¿Cancelar esta cita ahora?
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    El cliente recibirá una notificación push con opciones para
                    reprogramar o pedir reembolso del depósito.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowConfirmCancel(false)}
                      disabled={cancelling}
                    >
                      Volver
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      onClick={emergencyCancel}
                      disabled={cancelling}
                    >
                      {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <><XCircle className="h-4 w-4 mr-1" /> Cancelar cita</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-neutral-50 dark:bg-neutral-900 p-2">
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 font-semibold">{label}</p>
      <p className="font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{value}</p>
    </div>
  );
}
