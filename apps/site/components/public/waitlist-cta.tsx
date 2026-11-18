"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

/**
 * Booking waitlist widget — shown at the bottom of the public landing.
 *
 * Design: gated by a small "Notify me" button that expands into an inline
 * form (name + phone). Keeps the primary CTA (booking) uncluttered while
 * offering a fallback when no slots fit the client's schedule.
 */

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
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

type WaitlistResp = {
  waitlist_id: string;
  position: number;
};

export function WaitlistCta({ slug }: { slug: string }) {
  const t = useTranslations("publicBooking");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [day, setDay] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<WaitlistResp | null>(null);

  const submit = async () => {
    if (submitting || name.trim().length < 2 || phone.trim().length < 5) return;
    setSubmitting(true);
    try {
      const res = await api<WaitlistResp>("/public/waitlist/join", {
        method: "POST",
        body: JSON.stringify({
          slug,
          desired_day: day,
          client_name: name.trim(),
          client_phone: phone.trim(),
        }),
      });
      setResult(res);
      toast.success(t("waitlistJoined"));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("waitlistErr");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Track "form_open" event when the client expands the form.
  useEffect(() => {
    if (open) {
      const url = API_BASE
        ? `${API_BASE}/api/public/pro/${slug}/track`
        : `/api/public/pro/${slug}/track`;
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "form_open" }),
        keepalive: true,
      }).catch(() => {});
    }
  }, [open, slug]);

  if (result) {
    return (
      <Card className="mt-6 border-emerald-200 dark:border-emerald-800/60">
        <CardContent className="p-4 sm:p-6 flex items-center gap-3 text-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <div className="flex-1">
            <div className="font-semibold">{t("waitlistJoined")}</div>
            <div className="text-neutral-500 text-xs mt-0.5">
              {t("waitlistJoinedPos", { n: result.position })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardContent className="p-4 sm:p-6 space-y-3">
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {t("waitlistTitle")}
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              {t("waitlistDesc")}
            </p>
          </div>
          {!open && (
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              {t("waitlistBtn")}
            </Button>
          )}
        </div>

        {open && (
          <div className="grid gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div>
              <Label htmlFor="wl-day">Fecha deseada</Label>
              <Input id="wl-day" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="wl-name">Nombre</Label>
              <Input id="wl-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </div>
            <div>
              <Label htmlFor="wl-phone">Teléfono</Label>
              <Input id="wl-phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" />
            </div>
            <Button onClick={submit} disabled={submitting}>
              {t("waitlistBtn")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
