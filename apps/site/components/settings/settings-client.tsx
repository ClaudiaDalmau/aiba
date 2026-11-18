"use client";
import { useEffect, useState } from "react";
import { Sparkles, User, MessageCircle, TrendingDown, Copy, ExternalLink, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DefaultExtrasCard from "./default-extras-card";
import ProfilePicturesCard from "./profile-pictures-card";
import ProfileThemesCard from "./profile-themes-card";
import EmailRemindersCard from "./email-reminders-card";
import GoogleCalendarCard from "./google-calendar-card";

type FeeEst = {
  plan: string; rate: number; rate_pct: number;
  window_days: number;
  completed_bookings_30d: number;
  revenue_base_30d_eur: number;
  estimated_fee_30d_eur: number;
  actual_fees_30d_eur: number;
  all_rates: Record<string, { rate: number; rate_pct: number }>;
  upgrade_tips: { plan: string; rate: number; would_pay_30d: number; monthly_saving: number }[];
};

type TelegramStatus = {
  bot_username?: string;
  webhook_url?: string;
  ok?: boolean;
};

type MetaConfig = {
  app_name: string;
  version: string;
  mangopay_mode: string;
  ai_model: string;
};

type User = {
  user_id: string; email: string; full_name?: string; business_name?: string;
  plan: string; default_language?: string; timezone?: string; invite_code?: string;
};

export default function SettingsClient() {
  const [me, setMe] = useState<User | null>(null);
  const [fee, setFee] = useState<FeeEst | null>(null);
  const [tg, setTg] = useState<TelegramStatus | null>(null);
  const [meta, setMeta] = useState<MetaConfig | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((r) => setMe(r.user));
    api<FeeEst>("/payments/fee-estimate/mine").then(setFee).catch(() => {});
    api<TelegramStatus>("/telegram/status").then(setTg).catch(() => {});
    api<MetaConfig>("/meta/config").then(setMeta).catch(() => {});
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const deepLink = me && tg?.bot_username
    ? `https://t.me/${tg.bot_username.replace(/^@/, "")}?start=pro_${me.user_id}`
    : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">Cuenta</p>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Ajustes</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 mt-1">Perfil, plan, integración Telegram y AI Pay.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-violet-600" />
            <div>
              <CardTitle>Perfil profesional</CardTitle>
              <CardDescription>Datos de tu cuenta</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {me === null ? <Skeleton className="h-24" /> : (
            <div className="grid-cols-2 sm:grid-cols-4 gap-3">
              <Info2 label="Nombre" value={me.full_name || "—"} />
              <Info2 label="Marca" value={me.business_name || "—"} />
              <Info2 label="Email" value={me.email} />
              <Info2 label="Plan" value={(me.plan || "basic").toUpperCase()} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Pay fee */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-fuchsia-600" />
            <div>
              <CardTitle>AI Pay fee</CardTitle>
              <CardDescription>Tarifa por transacción aplicada al capturar el pago final.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {fee === null ? <Skeleton className="h-32" /> : (
            <>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-fuchsia-100 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-fuchsia-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">Plan {fee.plan.toUpperCase()}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-500">{fee.rate_pct}% por cita completada</p>
                </div>
                <p className="text-2xl font-bold text-fuchsia-700">{fee.rate_pct}%</p>
              </div>
              <Separator />
              <div className="grid-cols-2 sm:grid-cols-4 gap-2">
                <MiniStat label="Ingresos base 30d" value={`${fee.revenue_base_30d_eur.toFixed(2)}€`} />
                <MiniStat label="Coste estimado 30d" value={`${fee.estimated_fee_30d_eur.toFixed(2)}€`} accent="fuchsia" />
                <MiniStat label="Cobrado real 30d" value={`${fee.actual_fees_30d_eur.toFixed(2)}€`} />
                <MiniStat label="Citas completadas" value={String(fee.completed_bookings_30d)} />
              </div>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-2">Comparativa de planes</p>
                <div className="space-y-1">
                  {Object.entries(fee.all_rates).map(([p, m]) => {
                    const cur = p === fee.plan;
                    return (
                      <div key={p} className="flex items-center gap-3 py-1">
                        <span className={`h-2 w-2 rounded-full ${cur ? "bg-fuchsia-600" : "bg-neutral-300"}`} />
                        <span className={`flex-1 text-sm ${cur ? "font-semibold text-neutral-900 dark:text-neutral-100" : "text-neutral-600 dark:text-neutral-400 dark:text-neutral-500"}`}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </span>
                        <span className={`text-sm font-mono ${cur ? "font-semibold text-fuchsia-700" : "text-neutral-500 dark:text-neutral-400 dark:text-neutral-500"}`}>
                          {m.rate_pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {fee.upgrade_tips.length > 0 && (
                <div className="space-y-2">
                  {fee.upgrade_tips.map((t) => (
                    <div key={t.plan} className="rounded-md bg-emerald-50 border-emerald-200 p-2.5 flex items-start gap-2">
                      <TrendingDown className="h-3.5 w-3.5 text-emerald-600 mt-0.5" />
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        Con plan <b>{t.plan.toUpperCase()}</b> ahorrarías{" "}
                        <b className="text-emerald-700">{t.monthly_saving.toFixed(2)}€/mes</b> en fees (al {(t.rate * 100).toFixed(1)}%).
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <DefaultExtrasCard />

      {/* Iter56 — Multi-profile picture management with crop tool. */}
      <ProfilePicturesCard />

      {/* Iter56 P2 Fase 1.4 — Per-profile visual theme editor. */}
      <ProfileThemesCard />

      {/* Iter56 P2 Fase 2.1 — Email reminders opt-in. */}
      <EmailRemindersCard />

      {/* Iter57 Fase 2.3 — Google Calendar bidirectional sync. */}
      <GoogleCalendarCard />

      {/* Telegram */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Integración Telegram</CardTitle>
              <CardDescription>Deep link para tus clientes.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {tg === null ? <Skeleton className="h-20" /> : (
            <>
              <div className="flex items-center gap-2">
                <Badge className={tg.ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                  {tg.ok ? "Bot activo" : "Bot offline"}
                </Badge>
                {tg.bot_username && <Badge variant="outline">@{tg.bot_username.replace(/^@/, "")}</Badge>}
              </div>
              {deepLink && (
                <div>
                  <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-1">Tu enlace de reserva</p>
                  <div className="flex gap-2">
                    <code className="flex-1 rounded bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate">
                      {deepLink}
                    </code>
                    <Button size="sm" variant="outline" onClick={() => copy(deepLink, "link")}>
                      {copied === "link" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={deepLink} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" /></a>
                    </Button>
                  </div>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">Compártelo con tus clientes para que reserven vía el bot.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* System status */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-neutral-500 dark:text-neutral-400 dark:text-neutral-500" />
            <div>
              <CardTitle>Estado del sistema</CardTitle>
              <CardDescription>Info de la plataforma.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {meta === null ? <Skeleton className="h-20" /> : (
            <div className="grid-cols-2 sm:grid-cols-4 gap-3">
              <Info2 label="App" value={meta.app_name} />
              <Info2 label="Versión" value={meta.version} />
              <Info2 label="Mangopay" value={meta.mangopay_mode.toUpperCase()} />
              <Info2 label="AI Model" value={meta.ai_model} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info2({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 font-semibold">{label}</p>
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-0.5 truncate">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: "fuchsia" }) {
  return (
    <div className="rounded-md bg-neutral-50 dark:bg-neutral-900 p-2.5 text-center">
      <p className={`text-lg font-bold ${accent === "fuchsia" ? "text-fuchsia-700" : "text-neutral-900 dark:text-neutral-100"}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 dark:text-neutral-500 font-semibold mt-0.5">{label}</p>
    </div>
  );
}
