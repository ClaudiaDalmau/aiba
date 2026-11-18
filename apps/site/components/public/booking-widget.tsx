"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calendar, Clock, User, Phone, Mail, MessageCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

/**
 * Public booking widget — client component.
 *
 * Flow:
 *   1. Client picks a service
 *   2. Picks a day (next 14 days) → we fetch `/api/availability/{pro_id}/{day}`
 *   3. Picks a slot
 *   4. Fills name + phone (+ optional email/notes)
 *   5. Submits `POST /api/public/book` (no auth) → gets booking + Telegram deep-link
 *   6. Success state points the client to Telegram to complete the deposit
 *
 * Kept intentionally minimal (no calendar UI lib) to keep the bundle
 * lightweight; each day is a chip in a horizontal scroller.
 */

type Service = {
  service_id: string;
  name: string;
  description: string | null;
  duration_min: number;
  price_eur: number;
};

type ProCard = {
  pro_id: string;
  business_name: string;
  timezone: string;
  currency: string;
  telegram_deeplink: string | null;
  services: Service[];
};

type SlotHM = { start: string; end: string };

type NextSlot = {
  start_at: string;
  start: string;
  end: string;
  day_iso: string;
  weekday: number;
};

type DayAvailability = {
  date: string;
  free_slots: SlotHM[];
};

type BookResponse = {
  booking_id: string;
  scheduled_at: string;
  duration_min: number;
  price_eur: number;
  deposit_eur: number;
  verification_code: string;
  telegram_deeplink: string | null;
  status: string;
};

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

async function publicApi<T>(path: string, init?: RequestInit): Promise<T> {
  const url = API_BASE ? `${API_BASE}/api${path}` : `/api${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return {}; } })() : {};
  if (!res.ok) {
    const detail = (data as { detail?: string })?.detail;
    throw new Error(typeof detail === "string" ? detail : `HTTP ${res.status}`);
  }
  return data as T;
}

function fmtEur(n: number) {
  return `${n.toFixed(2).replace(/\.00$/, "")}€`;
}

function fmtDay(d: Date, locale: string) {
  return d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
}

function nextDays(n: number) {
  const arr: Date[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    arr.push(d);
  }
  return arr;
}

export function BookingWidget({ pro, slug }: { pro: ProCard; slug: string }) {
  const t = useTranslations("publicBooking");
  const locale = useLocale();
  const days = useMemo(() => nextDays(14), []);
  const [service, setService] = useState<Service | null>(pro.services[0] ?? null);
  const [day, setDay] = useState<Date>(days[0]);
  const [slots, setSlots] = useState<SlotHM[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [nextSlots, setNextSlots] = useState<NextSlot[]>([]);
  const [timeFilter, setTimeFilter] = useState<"all" | "am" | "pm">("all");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BookResponse | null>(null);

  // Fetch "next available slots" for the quick-book strip whenever the
  // service changes. Cached client-side, cheap to recompute.
  useEffect(() => {
    if (!service) { setNextSlots([]); return; }
    let cancelled = false;
    publicApi<NextSlot[]>(`/public/pro/${slug}/next-slots?service_id=${service.service_id}&limit=6`)
      .then((n) => { if (!cancelled) setNextSlots(n || []); })
      .catch(() => { if (!cancelled) setNextSlots([]); });
    return () => { cancelled = true; };
  }, [slug, service?.service_id, service]);

  // Track landing pageview (fire-and-forget). Ignores errors.
  useEffect(() => {
    const url = API_BASE
      ? `${API_BASE}/api/public/pro/${slug}/track`
      : `/api/public/pro/${slug}/track`;
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "view", referrer }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  // Reload slots on day/service change
  useEffect(() => {
    if (!service) return;
    let cancelled = false;
    const dayStr = day.toISOString().slice(0, 10);
    setSlotsLoading(true);
    setSelectedSlot(null);
    publicApi<DayAvailability>(
      `/availability/${pro.pro_id}/${dayStr}?service_id=${service.service_id}&duration=${service.duration_min}`,
    )
      .then((d) => { if (!cancelled) setSlots(d.free_slots || []); })
      .catch(() => { if (!cancelled) setSlots([]); })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [pro.pro_id, service?.service_id, day, service]);

  const canSubmit =
    !!service &&
    !!selectedSlot &&
    name.trim().length >= 2 &&
    phone.trim().length >= 6 &&
    !submitting;

  const submit = async () => {
    if (!canSubmit || !service || !selectedSlot) return;
    setSubmitting(true);
    try {
      // selectedSlot is "HH:MM" — combine with current day + pro timezone.
      // Simplification: send local wall-clock as UTC. Backend re-validates
      // against availability rules so drift is caught server-side.
      const [hh, mm] = selectedSlot.split(":").map(Number);
      const scheduled = new Date(day);
      scheduled.setHours(hh, mm, 0, 0);
      const res = await publicApi<BookResponse>("/public/book", {
        method: "POST",
        body: JSON.stringify({
          slug,
          service_id: service.service_id,
          starts_at: scheduled.toISOString(),
          client_name: name.trim(),
          client_phone: phone.trim(),
          client_email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      setResult(res);
      toast.success(t("bookedOk"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("errorBook");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const pickNext = (n: NextSlot) => {
    // Find the day in the local `days` array that matches.
    const target = days.find((d) => d.toISOString().slice(0, 10) === n.day_iso);
    if (target) setDay(target);
    setSelectedSlot(n.start);
  };

  const relLabel = (dayIso: string): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().slice(0, 10);
    if (dayIso === today) return t("quickBookToday");
    if (dayIso === tomorrow) return t("quickBookTomorrow");
    return new Date(dayIso).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });
  };

  // Filter slots by AM/PM (12:00 boundary). Applied to both the day picker
  // and the quick-book strip so users see a single consistent view.
  const applyFilter = <T extends { start: string }>(list: T[]): T[] => {
    if (timeFilter === "all") return list;
    return list.filter((s) => {
      const h = parseInt(s.start.split(":")[0], 10);
      return timeFilter === "am" ? h < 12 : h >= 12;
    });
  };
  const filteredSlots = applyFilter(slots);
  const filteredNextSlots = applyFilter(nextSlots);

  // Urgency: on the currently selected day, if <=3 slots left (after filter),
  // show a scarcity badge. Ignored on days with 0 slots (no data yet).
  const urgencyBadge: string | null = (() => {
    if (slotsLoading || filteredSlots.length === 0) return null;
    if (filteredSlots.length === 1) return t("urgencyLastOne");
    if (filteredSlots.length <= 3) return t("urgencyFewLeft", { n: filteredSlots.length });
    return null;
  })();

  // ---- Success state ----------------------------------------------------
  if (result) {
    return (
      <Card className="border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
            {t("successTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-white dark:bg-neutral-900 p-4 space-y-1 text-sm">
            <p><strong>{pro.business_name}</strong></p>
            <p>{service?.name} · {result.duration_min} min</p>
            <p>
              {new Date(result.scheduled_at).toLocaleString(locale, {
                weekday: "long", day: "numeric", month: "long",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
            <p className="text-emerald-700 dark:text-emerald-400 font-semibold pt-2">
              {t("portalDeposit")}: {fmtEur(result.deposit_eur)} · {t("portalTotal")}: {fmtEur(result.price_eur)}
            </p>
          </div>
          <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            <p><strong>{t("successHold")}</strong></p>
            <ol className="list-decimal ml-5 space-y-1">
              <li>{t("successStep1")}</li>
              <li>{t("successStep2")}</li>
              <li>{t("successStep3")}</li>
            </ol>
          </div>
          {result.telegram_deeplink && (
            <a
              href={result.telegram_deeplink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#229ED9] hover:bg-[#1a86b8] text-white font-semibold py-3 rounded-lg transition"
            >
              <MessageCircle className="h-5 w-5" />
              {t("successCta")}
              <ArrowRight className="h-4 w-4" />
            </a>
          )}
          <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
            {t("verifyCode")} <span className="font-mono font-bold">{result.verification_code}</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  // ---- Booking form -----------------------------------------------------
  if (pro.services.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-neutral-500">
          {t("noServices")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-6">

        {/* Step 1: Service */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
            {t("chooseService")}
          </h2>
          <div className="grid gap-2">
            {pro.services.map((s) => {
              const sel = s.service_id === service?.service_id;
              return (
                <button
                  key={s.service_id}
                  type="button"
                  onClick={() => setService(s)}
                  className={`w-full text-left rounded-lg border p-3 transition ${
                    sel
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                      : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-50">{s.name}</div>
                      {s.description && (
                        <div className="text-xs text-neutral-500 mt-1 line-clamp-2">{s.description}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{fmtEur(s.price_eur)}</div>
                      <div className="text-xs text-neutral-500">{s.duration_min} min</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Quick-book strip — clickable next-available slots */}
        {service && filteredNextSlots.length > 0 && (
          <section aria-label={t("quickBookTitle")}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
              ⚡ {t("quickBookTitle")}
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {filteredNextSlots.map((n) => {
                const sel = selectedSlot === n.start && day.toISOString().slice(0, 10) === n.day_iso;
                return (
                  <button
                    key={`${n.day_iso}T${n.start}`}
                    type="button"
                    onClick={() => pickNext(n)}
                    className={`flex-none rounded-lg border px-3 py-2 min-w-[112px] text-center transition ${
                      sel
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 hover:border-emerald-400"
                    }`}
                  >
                    <div className="text-[10px] font-medium capitalize opacity-75">{relLabel(n.day_iso)}</div>
                    <div className="text-sm font-bold">{n.start}</div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* AM/PM filter — applied globally to both quick-book + day slots */}
        {service && (
          <div className="flex items-center gap-2 flex-wrap">
            {(["all", "am", "pm"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setTimeFilter(f)}
                data-testid={`filter-${f}`}
                className={`text-xs px-3 py-1 rounded-full border transition ${
                  timeFilter === f
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-emerald-400"
                }`}
              >
                {f === "all" ? t("filterAll") : f === "am" ? "☀ " + t("filterAM") : "🌙 " + t("filterPM")}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Day */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> {t("chooseDay")}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {days.map((d) => {
              const sel = d.toDateString() === day.toDateString();
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => setDay(d)}
                  className={`flex-none rounded-lg border px-3 py-2 min-w-[76px] text-center transition ${
                    sel
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
                  }`}
                >
                  <div className="text-xs font-medium capitalize">{fmtDay(d, locale)}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 3: Slot */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3 flex items-center gap-2 flex-wrap">
            <Clock className="h-4 w-4" /> {t("chooseTime")}
            {urgencyBadge && (
              <span
                data-testid="urgency-badge"
                className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 animate-pulse"
              >
                🔥 {urgencyBadge}
              </span>
            )}
          </h2>
          {slotsLoading ? (
            <div className="flex items-center gap-2 text-neutral-500 text-sm py-6">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("loadingSlots")}
            </div>
          ) : filteredSlots.length === 0 ? (
            <div className="text-sm text-neutral-500 py-4">
              {t("noSlots")}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {filteredSlots.map((slot) => {
                const sel = slot.start === selectedSlot;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() => setSelectedSlot(slot.start)}
                    className={`rounded-lg border py-2 text-sm font-semibold transition ${
                      sel
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400"
                    }`}
                  >
                    {slot.start}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Step 4: Contact */}
        {selectedSlot && (
          <section className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 flex items-center gap-2">
              <User className="h-4 w-4" /> {t("yourDetails")}
            </h2>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="pubName">{t("fullName")}</Label>
                <Input id="pubName" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder={t("fullNamePh")} />
              </div>
              <div>
                <Label htmlFor="pubPhone" className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {t("phone")}
                </Label>
                <Input id="pubPhone" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder={t("phonePh")} inputMode="tel" />
              </div>
              <div>
                <Label htmlFor="pubEmail" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {t("email")} <span className="text-neutral-400 text-xs">{t("optional")}</span>
                </Label>
                <Input id="pubEmail" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder={t("emailPh")} />
              </div>
              <div>
                <Label htmlFor="pubNotes">{t("notes")} <span className="text-neutral-400 text-xs">{t("optional")}</span></Label>
                <Input id="pubNotes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notesPh")} />
              </div>
            </div>

            <Button
              className="w-full mt-2"
              size="lg"
              onClick={submit}
              disabled={!canSubmit}
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {t("bookBtn")} ({service && fmtEur(service.price_eur * 0.3)} {t("depositLabel")})
            </Button>

            <p className="text-xs text-neutral-500 text-center">
              {t("policyTerms")}
            </p>
          </section>
        )}
      </CardContent>

      {/* Sticky "Book now" bar (mobile only) — visible when the user has
          picked a slot but hasn't clicked the primary CTA yet. Scrolls the
          form into view on tap. */}
      {selectedSlot && !result && (
        <div
          data-testid="sticky-book"
          className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 shadow-lg"
        >
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              if (canSubmit) submit();
              else document.getElementById("pubName")?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {t("stickyBook")}
          </Button>
        </div>
      )}
    </Card>
  );
}
