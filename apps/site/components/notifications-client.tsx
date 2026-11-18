"use client";
import { useEffect, useState } from "react";
import {
  Bell, Mail, MessageSquare, TrendingUp, Sparkles, Calendar, ShieldCheck,
  RefreshCw, Loader2, Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

type ForumFreq = "off" | "weekly" | "monthly";

type Prefs = {
  weekly_growth_digest: boolean;
  forum_digest_frequency: ForumFreq;
  product_updates: boolean;
  marketing_emails: boolean;
  booking_alerts: boolean;
  booking_alerts_email: boolean;
  booking_alerts_push: boolean;
  security_alerts: boolean;
};

export default function NotificationsClient() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const load = async () => {
    try {
      const r = await fetch("/api/backend/notifications/prefs", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setPrefs(await r.json());
    } catch (e: any) {
      toast.error(e.message || "No se pudieron cargar las preferencias");
    }
  };
  useEffect(() => { load(); }, []);

  const update = async (patch: Partial<Prefs>, keyLabel: string) => {
    if (!prefs) return;
    setSaving(keyLabel);
    // Optimistic
    const prev = prefs;
    setPrefs({ ...prev, ...patch });
    try {
      const r = await fetch("/api/backend/notifications/prefs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setPrefs(await r.json());
      toast.success("Preferencia guardada");
    } catch (e: any) {
      setPrefs(prev);
      toast.error(e.message || "No se pudo guardar");
    } finally {
      setSaving(null);
    }
  };

  const reset = async () => {
    setResetting(true);
    try {
      const r = await fetch("/api/backend/notifications/prefs/reset", { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setPrefs(await r.json());
      toast.success("Preferencias restauradas");
    } catch (e: any) {
      toast.error(e.message || "Error al restaurar");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Notificaciones
          </p>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Preferencias de correo
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Elige qué emails quieres recibir. Los cambios se aplican en tiempo real.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={reset}
          disabled={resetting || !prefs}
        >
          {resetting
            ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
          Restaurar por defecto
        </Button>
      </div>

      {prefs === null ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <div className="space-y-3">
          <ToggleCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Resumen semanal de crecimiento"
            description="Cada domingo: MRR, funnel de conversión y top clientes."
            checked={prefs.weekly_growth_digest}
            onChange={(v) => update({ weekly_growth_digest: v }, "weekly_growth_digest")}
            saving={saving === "weekly_growth_digest"}
          />

          <ForumFreqCard
            value={prefs.forum_digest_frequency}
            onChange={(v) => update({ forum_digest_frequency: v }, "forum_digest_frequency")}
            saving={saving === "forum_digest_frequency"}
          />

          <BookingAlertsCard
            prefs={prefs}
            saving={saving}
            onChange={(patch, key) => update(patch, key)}
          />

          <ToggleCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Novedades del producto"
            description="Anuncios ocasionales cuando lanzamos features grandes."
            checked={prefs.product_updates}
            onChange={(v) => update({ product_updates: v }, "product_updates")}
            saving={saving === "product_updates"}
          />

          <ToggleCard
            icon={<Mail className="h-5 w-5" />}
            title="Tips y casos de éxito"
            description="Trucos para mejorar tu conversión y ejemplos de otras pros."
            checked={prefs.marketing_emails}
            onChange={(v) => update({ marketing_emails: v }, "marketing_emails")}
            saving={saving === "marketing_emails"}
          />

          <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm">
                  Correos de seguridad
                </p>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 mt-0.5">
                  Reset de contraseña, avisos de login inusual y confirmación de borrado. Siempre activos.
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">Obligatorio</Badge>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-dashed">
        <CardContent className="p-4 text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
          <p className="font-semibold text-neutral-800 dark:text-neutral-200">
            Notas
          </p>
          <p>• Los recordatorios que reciben tus <b>clientes</b> se configuran en Ajustes → Recordatorios.</p>
          <p>• Puedes cambiar estas preferencias cuando quieras — no bloquean la cuenta.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleCard({
  icon, title, description, checked, onChange, saving,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  saving: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
          checked
            ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500"
        }`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
            {title}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {description}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400" />}
          <Switch checked={checked} onCheckedChange={onChange} disabled={saving} />
        </div>
      </CardContent>
    </Card>
  );
}

// Iter73 — Booking alerts card with two channels (email + push)
function BookingAlertsCard({
  prefs, saving, onChange,
}: {
  prefs: Prefs;
  saving: string | null;
  onChange: (patch: Partial<Prefs>, key: string) => void;
}) {
  const anyOn = prefs.booking_alerts_email || prefs.booking_alerts_push;
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
            anyOn
              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500"
          }`}>
            <Calendar className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
              Avisos de reservas nuevas
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Elige cómo quieres enterarte cuando entre una reserva por Telegram, teléfono o página.
            </p>
          </div>
        </div>

        <div className="ml-13 grid gap-2">
          <ChannelRow
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            hint="Se envía a tu correo de la cuenta."
            checked={prefs.booking_alerts_email}
            onChange={(v) => onChange({ booking_alerts_email: v }, "booking_alerts_email")}
            saving={saving === "booking_alerts_email"}
          />
          <ChannelRow
            icon={<Smartphone className="h-4 w-4" />}
            label="Notificación al móvil"
            hint="Push a la app de Expo. Requiere la app instalada."
            checked={prefs.booking_alerts_push}
            onChange={(v) => onChange({ booking_alerts_push: v }, "booking_alerts_push")}
            saving={saving === "booking_alerts_push"}
          />
        </div>

        {!anyOn && (
          <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md px-2 py-1.5">
            ⚠️ Con los dos canales apagados no recibirás ningún aviso al entrar una reserva.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ChannelRow({
  icon, label, hint, checked, onChange, saving,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  saving: boolean;
}) {
  return (
    <div className="flex items-center gap-3 pl-13 -ml-1 pr-1 py-1.5 rounded-md bg-neutral-50 dark:bg-neutral-900/50">
      <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${
        checked
          ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
          : "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500"
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">{label}</p>
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{hint}</p>
      </div>
      <div className="shrink-0 flex items-center gap-1.5">
        {saving && <Loader2 className="h-3 w-3 animate-spin text-neutral-400" />}
        <Switch checked={checked} onCheckedChange={onChange} disabled={saving} />
      </div>
    </div>
  );
}

function ForumFreqCard({
  value, onChange, saving,
}: {
  value: ForumFreq;
  onChange: (v: ForumFreq) => void;
  saving: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
          value !== "off"
            ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500"
        }`}>
          <MessageSquare className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
            Resumen del foro AIB
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Top posts, menciones sin leer y respuestas a tus hilos.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-400 mr-1" />}
          {(["off", "weekly", "monthly"] as ForumFreq[]).map((opt) => {
            const label = opt === "off" ? "Off" : opt === "weekly" ? "Sem." : "Mens.";
            const active = value === opt;
            return (
              <Button
                key={opt}
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => onChange(opt)}
                disabled={saving}
                className="h-7 px-2 text-[11px]"
              >
                {label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
