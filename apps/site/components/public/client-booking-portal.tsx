"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarCheck, Clock, User, XCircle, MessageCircle, ExternalLink, Loader2, CheckCircle2, AlertTriangle, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type BookingDetail = {
  booking_id: string;
  scheduled_at: string;
  duration_min: number;
  price_eur: number;
  deposit_eur: number;
  status: string;
  service_name: string;
  business_name: string;
  client_name: string;
  can_cancel: boolean;
  telegram_deeplink: string | null;
  cancellation_policy_hours: number;
};

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

function fmtEur(n: number) { return `${n.toFixed(2).replace(/\.00$/, "")}€`; }

export function ClientBookingPortal({
  booking: initial, code, bookingId,
}: { booking: BookingDetail; code: string; bookingId: string }) {
  const t = useTranslations("publicBooking");
  const locale = useLocale();
  const [booking, setBooking] = useState(initial);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDateTime, setNewDateTime] = useState("");

  // Status pill styling & translated label are chosen from the message
  // catalog so every locale sees the pill in their language.
  const STATUS_META: Record<string, { key: string; color: string; bg: string }> = {
    pending_deposit:  { key: "statusPending",         color: "text-amber-800",   bg: "bg-amber-100"    },
    confirmed:        { key: "statusConfirmed",       color: "text-emerald-800", bg: "bg-emerald-100"  },
    reminded:         { key: "statusReminded",        color: "text-blue-800",    bg: "bg-blue-100"     },
    cancelled:        { key: "statusCancelled",       color: "text-red-800",     bg: "bg-red-100"      },
    cancelled_by_pro: { key: "statusCancelledByPro",  color: "text-red-800",     bg: "bg-red-100"      },
    completed:        { key: "statusCompleted",       color: "text-neutral-800", bg: "bg-neutral-200"  },
    no_show:          { key: "statusNoShow",          color: "text-red-800",     bg: "bg-red-100"      },
    refunded:         { key: "statusRefunded",        color: "text-neutral-800", bg: "bg-neutral-200"  },
  };

  const meta = STATUS_META[booking.status] || { key: "", color: "text-neutral-800", bg: "bg-neutral-100" };
  const statusLabel = meta.key ? t(meta.key) : booking.status;
  const scheduled = new Date(booking.scheduled_at);

  const doCancel = async () => {
    setBusy(true);
    try {
      const url = API_BASE
        ? `${API_BASE}/api/public/booking/${bookingId}/cancel`
        : `/api/public/booking/${bookingId}/cancel`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, reason: reason.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      toast.success(t("cancelledOk"));
      setBooking((b) => ({ ...b, status: "cancelled", can_cancel: false }));
      setConfirmOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("cancelError"));
    } finally {
      setBusy(false);
    }
  };

  const doReschedule = async () => {
    if (!newDateTime) return;
    setBusy(true);
    try {
      const url = API_BASE
        ? `${API_BASE}/api/public/booking/${bookingId}/reschedule`
        : `/api/public/booking/${bookingId}/reschedule`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          // <input type="datetime-local"> returns local wall-clock without tz.
          // Parse as local then send as ISO UTC.
          new_starts_at: new Date(newDateTime).toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || `HTTP ${res.status}`);
      toast.success(t("reschedule_ok"));
      setBooking((b) => ({ ...b, scheduled_at: data.scheduled_at || b.scheduled_at }));
      setRescheduleOpen(false);
      setNewDateTime("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("reschedule_error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <CalendarCheck className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">{booking.business_name}</CardTitle>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${meta.color} ${meta.bg}`}>
              {statusLabel}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Details */}
        <dl className="grid grid-cols-3 gap-y-3 gap-x-4 text-sm">
          <dt className="text-neutral-500">{t("portalService")}</dt>
          <dd className="col-span-2 font-medium">{booking.service_name}</dd>

          <dt className="text-neutral-500 flex items-center gap-1"><Clock className="h-3 w-3" /> {t("portalDate")}</dt>
          <dd className="col-span-2 font-medium">
            {scheduled.toLocaleString(locale, {
              weekday: "long", day: "numeric", month: "long",
              hour: "2-digit", minute: "2-digit",
            })}
          </dd>

          <dt className="text-neutral-500">{t("portalDuration")}</dt>
          <dd className="col-span-2 font-medium">{booking.duration_min} min</dd>

          <dt className="text-neutral-500 flex items-center gap-1"><User className="h-3 w-3" /> {t("portalName")}</dt>
          <dd className="col-span-2 font-medium">{booking.client_name || "—"}</dd>

          <dt className="text-neutral-500">{t("portalTotal")}</dt>
          <dd className="col-span-2 font-semibold text-emerald-700 dark:text-emerald-400">
            {fmtEur(booking.price_eur)}
            {booking.deposit_eur > 0 && (
              <span className="text-neutral-500 font-normal"> · {t("portalDeposit")} {fmtEur(booking.deposit_eur)}</span>
            )}
          </dd>
        </dl>

        {/* Pending deposit CTA */}
        {booking.status === "pending_deposit" && booking.telegram_deeplink && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
            <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 flex-none mt-0.5" />
              <p className="text-sm">
                {t("pendingMsg")}
              </p>
            </div>
            <a
              href={booking.telegram_deeplink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#229ED9] hover:bg-[#1a86b8] text-white font-semibold py-2.5 rounded-lg transition text-sm"
            >
              <MessageCircle className="h-4 w-4" />
              {t("pendingCta")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Confirmed */}
        {["confirmed", "reminded"].includes(booking.status) && (
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-3 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 flex-none mt-0.5 text-emerald-700 dark:text-emerald-400" />
            <p className="text-sm text-emerald-900 dark:text-emerald-200">
              {t("confirmedMsg")}
            </p>
          </div>
        )}

        {/* Reschedule */}
        {booking.can_cancel && !rescheduleOpen && !confirmOpen && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setRescheduleOpen(true)}
          >
            <CalendarClock className="h-4 w-4 mr-2" /> {t("rescheduleBtn")}
          </Button>
        )}

        {rescheduleOpen && (
          <div className="rounded-lg border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-3 space-y-3">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              {t("rescheduleTitle")}
            </p>
            <div>
              <Label htmlFor="newDate" className="text-xs">{t("new_datetime")}</Label>
              <Input
                id="newDate"
                type="datetime-local"
                value={newDateTime}
                onChange={(e) => setNewDateTime(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setRescheduleOpen(false); setNewDateTime(""); }} disabled={busy}>
                {t("backBtn")}
              </Button>
              <Button
                className="flex-1"
                onClick={doReschedule}
                disabled={busy || !newDateTime}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirmReschedule")}
              </Button>
            </div>
          </div>
        )}

        {/* Cancel */}
        {booking.can_cancel && !confirmOpen && !rescheduleOpen && (
          <Button
            variant="outline"
            className="w-full border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
            onClick={() => setConfirmOpen(true)}
          >
            <XCircle className="h-4 w-4 mr-2" /> {t("cancelBtn")}
          </Button>
        )}

        {confirmOpen && (
          <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 p-3 space-y-3">
            <p className="text-sm font-semibold text-red-900 dark:text-red-200">
              {t("cancelConfirm")}
            </p>
            <div>
              <Label htmlFor="reason" className="text-xs">{t("cancelReasonLabel")} <span className="text-neutral-400">{t("optional")}</span></Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("cancelReasonPh")}
                maxLength={280}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)} disabled={busy}>
                {t("backBtn")}
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={doCancel} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirmCancelBtn")}
              </Button>
            </div>
          </div>
        )}

        {!booking.can_cancel && ["pending_deposit", "confirmed", "reminded"].includes(booking.status) && (
          <p className="text-xs text-neutral-500 text-center">
            {t("outOfPolicy", { hours: booking.cancellation_policy_hours })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
