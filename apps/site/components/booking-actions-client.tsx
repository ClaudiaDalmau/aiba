"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar, CheckCircle2, Clock, Loader2, AlertCircle, ArrowLeft,
  CalendarClock, XCircle, Store, Sparkles, Info, ChevronLeft, ChevronRight,
} from "lucide-react";

type Actions = {
  reschedule: { allowed: boolean; reason: string | null };
  cancel: { allowed: boolean; reason: string | null };
};

type Snapshot = {
  booking: {
    booking_id: string;
    status: string;
    scheduled_at: string;
    duration_min: number;
    price_eur: number;
    deposit_paid: boolean;
  };
  pro: { display_name: string };
  client: { name_masked: string; email_masked: string };
  service: { name: string; service_id: string | null; duration_min: number } | null;
  profile: { alias: string | null; landing_slug: string | null; theme: any } | null;
  actions: Actions;
  server_time: string;
};

type Interval = { start: string; end: string };

type Tab = "info" | "reschedule" | "cancel";

const REASON_COPY: Record<string, string> = {
  already_closed: "Esta cita ya está finalizada o cancelada.",
  pending_pro_review: "La cita está pendiente de aprobación del profesional.",
  too_close: "Falta muy poco para tu cita — ya no puedes hacer cambios aquí.",
  already_past: "Esta cita ya ha pasado.",
  invalid_token: "El enlace no es válido.",
  expired: "El enlace ha caducado.",
  not_found: "No pudimos encontrar tu reserva.",
};

function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  if (base) return `${base.replace(/\/$/, "")}${path}`;
  return `/api/backend${path.replace(/^\/api/, "")}`;
}

function fmtDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function BookingActionsClient({ token }: { token: string }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("info");

  const load = useCallback(async () => {
    try {
      const r = await fetch(apiUrl(`/api/public/booking-actions/${token}`), {
        cache: "no-store",
      });
      if (!r.ok) {
        const detail =
          r.status === 410 ? "expired" :
          r.status === 404 ? "not_found" :
          "invalid_token";
        setLoadError(detail);
        return;
      }
      const d = (await r.json()) as Snapshot;
      setSnap(d);
      setLoadError(null);
    } catch (e: any) {
      setLoadError("network_error");
    }
  }, [token]);

  useEffect(() => {
    load();
    // Read query ?action= to pre-select the tab (matches email button hrefs)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const a = params.get("action");
      if (a === "reschedule" || a === "cancel") setTab(a);
    }
  }, [load]);

  // ─── Error states ────────────────────────────────────────────────
  if (loadError) {
    const msg = REASON_COPY[loadError] || "Este enlace no está disponible.";
    return (
      <Shell>
        <div className="p-8 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-600 dark:text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-red-900 dark:text-red-100 mb-1">
            No pudimos abrir tu reserva
          </h1>
          <p className="text-sm text-red-700 dark:text-red-300">{msg}</p>
          <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-4">
            Si crees que es un error, contacta directamente con tu profesional.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 mt-6 text-sm text-violet-700 dark:text-violet-300 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio
          </Link>
        </div>
      </Shell>
    );
  }

  if (!snap) {
    return (
      <Shell>
        <div className="p-10 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-violet-600 animate-spin" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Cargando tu reserva…</p>
        </div>
      </Shell>
    );
  }

  const closed = ["cancelled", "cancelled_by_pro", "refunded", "completed", "no_show"].includes(snap.booking.status);

  return (
    <Shell>
      {/* Booking card */}
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
            <Calendar className="h-6 w-6 text-violet-700 dark:text-violet-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Tu cita
            </p>
            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5 capitalize">
              {fmtDateLong(snap.booking.scheduled_at)}
            </p>
            <p className="text-4xl font-bold text-violet-700 dark:text-violet-300 mt-2 tabular-nums">
              {fmtTime(snap.booking.scheduled_at)}
            </p>
          </div>
        </div>

        <div className="mt-5 pt-5 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5 text-sm">
          <Row icon={<Store className="h-4 w-4" />} label="Profesional" value={snap.pro.display_name} />
          {snap.service && (
            <Row icon={<Sparkles className="h-4 w-4" />} label="Servicio" value={snap.service.name} />
          )}
          <Row icon={<Clock className="h-4 w-4" />} label="Duración" value={`${snap.booking.duration_min} min`} />
          {snap.booking.deposit_paid && (
            <Row
              icon={<Info className="h-4 w-4" />}
              label="Depósito"
              value={<span className="text-emerald-700 dark:text-emerald-400 font-semibold">Pagado ✓</span>}
            />
          )}
        </div>
      </div>

      {closed ? (
        <div className="mt-6 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-600 dark:text-emerald-400 mb-3" />
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            Esta reserva ya está{" "}
            {snap.booking.status === "refunded"
              ? "cancelada y reembolsada"
              : snap.booking.status === "completed"
              ? "completada"
              : "cancelada"}
            .
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
            No hay nada más que hacer aquí.
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <TabButton
              active={tab === "reschedule"}
              disabled={!snap.actions.reschedule.allowed}
              onClick={() => setTab("reschedule")}
              icon={<CalendarClock className="h-4 w-4" />}
              label="Reagendar"
              hint={
                snap.actions.reschedule.allowed
                  ? "Elige otro día y hora"
                  : REASON_COPY[snap.actions.reschedule.reason || ""] || "No disponible"
              }
              color="violet"
            />
            <TabButton
              active={tab === "cancel"}
              disabled={!snap.actions.cancel.allowed}
              onClick={() => setTab("cancel")}
              icon={<XCircle className="h-4 w-4" />}
              label="Cancelar"
              hint={
                snap.actions.cancel.allowed
                  ? snap.booking.deposit_paid
                    ? "Con o sin reembolso"
                    : "Sin cargo"
                  : REASON_COPY[snap.actions.cancel.reason || ""] || "No disponible"
              }
              color="rose"
            />
          </div>

          {tab === "reschedule" && snap.actions.reschedule.allowed && (
            <ReschedulePane token={token} snap={snap} onSuccess={load} />
          )}

          {tab === "cancel" && snap.actions.cancel.allowed && (
            <CancelPane token={token} snap={snap} onSuccess={load} />
          )}

          {tab === "info" && (
            <div className="mt-4 p-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                <b>Necesitas cambiar la cita?</b> Elige arriba la opción que necesites.
                Si el enlace no funciona, contáctanos y te ayudamos.
              </p>
            </div>
          )}
        </>
      )}
    </Shell>
  );
}

// ─── Reschedule pane ──────────────────────────────────────────────

function ReschedulePane({
  token,
  snap,
  onSuccess,
}: {
  token: string;
  snap: Snapshot;
  onSuccess: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    // Default to tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [slots, setSlots] = useState<Interval[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ new_scheduled_at: string } | null>(null);

  const dateISO = useMemo(() => toISODate(selectedDate), [selectedDate]);

  useEffect(() => {
    if (done) return;
    setLoadingSlots(true);
    setError(null);
    setSelectedSlot(null);
    fetch(apiUrl(`/api/public/booking-actions/${token}/availability?date=${dateISO}`), {
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) {
          setSlots([]);
          return;
        }
        const d = await r.json();
        setSlots(d.free_slots || []);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [dateISO, token, done]);

  const shiftDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return;
    setSelectedDate(d);
  };

  const submit = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const [h, m] = selectedSlot.split(":");
      const target = new Date(selectedDate);
      target.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      const r = await fetch(apiUrl(`/api/public/booking-actions/${token}/reschedule`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_scheduled_at: target.toISOString() }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        setError(body.detail || `HTTP ${r.status}`);
        return;
      }
      const body = await r.json();
      setDone({ new_scheduled_at: body.new_scheduled_at });
      onSuccess();
    } catch (e: any) {
      setError(e?.message || "network_error");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mt-6 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-center">
        <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
        <p className="font-semibold text-emerald-900 dark:text-emerald-100">
          ¡Cita reagendada correctamente!
        </p>
        <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-2 capitalize">
          Nueva fecha: <b>{fmtDateLong(done.new_scheduled_at)}</b>
        </p>
        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mt-2 tabular-nums">
          {fmtTime(done.new_scheduled_at)}
        </p>
        <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70 mt-3">
          Te enviaremos un nuevo recordatorio antes de la nueva cita.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-5 rounded-2xl border border-violet-200 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-950/20">
      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
        Elige nuevo día y hora
      </h3>

      {/* Day picker */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => shiftDay(-1)}
          className="p-2 rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800"
          aria-label="Día anterior"
        >
          <ChevronLeft className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
        </button>
        <div className="flex-1 text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold tracking-wide">
            {selectedDate.toLocaleDateString("es-ES", { weekday: "short" })}
          </p>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100 capitalize">
            {selectedDate.toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <button
          onClick={() => shiftDay(1)}
          className="p-2 rounded-md border border-neutral-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800"
          aria-label="Día siguiente"
        >
          <ChevronRight className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
        </button>
      </div>

      {/* Slots */}
      <div className="mt-4 min-h-[100px]">
        {loadingSlots ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 text-violet-600 animate-spin" />
          </div>
        ) : slots && slots.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((s) => (
              <button
                key={s.start}
                onClick={() => setSelectedSlot(s.start)}
                className={`py-2.5 px-2 rounded-lg font-semibold text-sm tabular-nums transition-colors ${
                  selectedSlot === s.start
                    ? "bg-violet-600 text-white border border-violet-700"
                    : "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:border-violet-400 dark:hover:border-violet-600"
                }`}
              >
                {s.start}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No hay huecos disponibles este día.
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Prueba otro día tocando las flechas.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {error && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {REASON_COPY[error] || error}
        </p>
      )}
      <div className="mt-4 pt-4 border-t border-violet-200/50 dark:border-violet-900/40">
        <button
          onClick={submit}
          disabled={!selectedSlot || submitting}
          className="w-full py-3 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Reagendando…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" /> Confirmar nueva hora
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Cancel pane ─────────────────────────────────────────────────

function CancelPane({
  token,
  snap,
  onSuccess,
}: {
  token: string;
  snap: Snapshot;
  onSuccess: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    refund_action: string;
    refund_amount_eur: number;
  } | null>(null);

  // Compute refund preview so the client knows what to expect.
  const now = new Date();
  const scheduled = new Date(snap.booking.scheduled_at);
  const hoursOut = (scheduled.getTime() - now.getTime()) / 1000 / 3600;
  const refundPreview: "full_refund" | "retained" | "no_deposit" =
    !snap.booking.deposit_paid ? "no_deposit" : hoursOut >= 24 ? "full_refund" : "retained";

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch(apiUrl(`/api/public/booking-actions/${token}/cancel`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || null }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        setError(body.detail || `HTTP ${r.status}`);
        return;
      }
      const body = await r.json();
      setDone({
        refund_action: body.refund_action,
        refund_amount_eur: body.refund_amount_eur,
      });
      onSuccess();
    } catch (e: any) {
      setError(e?.message || "network_error");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mt-6 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-center">
        <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
        <p className="font-semibold text-emerald-900 dark:text-emerald-100">
          Cita cancelada
        </p>
        {done.refund_action === "full_refund" && (
          <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-2">
            Te reembolsaremos <b>{done.refund_amount_eur.toFixed(2)} €</b> en los próximos días.
          </p>
        )}
        {done.refund_action === "retained" && (
          <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-2">
            Tu depósito se ha retenido según la política de cancelación.
          </p>
        )}
        {done.refund_action === "no_deposit" && (
          <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-2">
            No había depósito pagado — no hay cargo alguno.
          </p>
        )}
        <p className="text-xs text-emerald-700/70 dark:text-emerald-300/70 mt-3">
          Hemos avisado al profesional de la cancelación.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-5 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20">
      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
        Cancelar tu cita
      </h3>

      {/* Refund preview */}
      <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1">
          Qué pasará con el depósito
        </p>
        {refundPreview === "full_refund" && (
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">
            ✓ Reembolso completo — cancelas con más de 24h de antelación.
          </p>
        )}
        {refundPreview === "retained" && (
          <p className="text-sm text-amber-700 dark:text-amber-300 font-semibold">
            ⚠ El depósito se retendrá — quedan menos de 24h para la cita.
          </p>
        )}
        {refundPreview === "no_deposit" && (
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            No había depósito. No hay cargo.
          </p>
        )}
      </div>

      <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">
        ¿Nos cuentas el motivo? (opcional)
      </label>
      <textarea
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 280))}
        placeholder="Ej: Me ha surgido un imprevisto..."
        className="w-full text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:border-rose-400"
      />
      <p className="text-[10px] text-neutral-400 mt-0.5 text-right">{reason.length}/280</p>

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {REASON_COPY[error] || error}
        </p>
      )}

      {confirming ? (
        <div className="mt-4 pt-4 border-t border-rose-200 dark:border-rose-900">
          <p className="text-sm font-semibold text-rose-900 dark:text-rose-100 mb-3">
            ¿Estás seguro? Esta acción no se puede deshacer.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Volver
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="py-3 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-300 disabled:text-neutral-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Cancelando…
                </>
              ) : (
                <>Sí, cancelar</>
              )}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="mt-4 w-full py-3 rounded-lg border-2 border-rose-500 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold text-sm"
        >
          Cancelar cita
        </button>
      )}
    </div>
  );
}

// ─── UI helpers ──────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            AIBA
          </span>
        </div>
        {children}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-300"
          >
            aibookingassistant.app
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-neutral-400 dark:text-neutral-500">{icon}</div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 w-24">{label}</p>
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex-1">
        {value}
      </p>
    </div>
  );
}

function TabButton({
  active,
  disabled,
  onClick,
  icon,
  label,
  hint,
  color,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
  color: "violet" | "rose";
}) {
  const activeStyles =
    color === "violet"
      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300"
      : "border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300";
  const idleStyles =
    "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300";
  const disabledStyles =
    "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 text-neutral-400 dark:text-neutral-500 cursor-not-allowed";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-3 rounded-xl border-2 text-left transition-colors ${
        disabled ? disabledStyles : active ? activeStyles : idleStyles
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-semibold text-sm">{label}</span>
      </div>
      <p className="text-[11px] mt-1 leading-tight">{hint}</p>
    </button>
  );
}
