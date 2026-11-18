"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Gift, Copy, Share2, Users, TrendingUp, Trophy, Loader2, Check,
} from "lucide-react";
import { toast } from "sonner";

type MyReferral = {
  code: string;
  share_url: string;
  reward_per_conversion_eur: number;
  invited_total: number;
  invited_paid: number;
  conversion_rate_pct: number;
  rewards_earned_eur: number;
  recent: Array<{
    referral_id: string;
    referred_business_name?: string | null;
    referred_email?: string | null;
    status: "pending" | "paid" | "churned";
    created_at: string;
    converted_at?: string | null;
  }>;
};

type LeaderRow = {
  rank: number;
  user_id: string;
  business_name: string;
  avatar_url?: string | null;
  paid_count: number;
};

function statusChip(status: string) {
  if (status === "paid") return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">Pagado</Badge>;
  if (status === "pending") return <Badge variant="outline">Pendiente</Badge>;
  if (status === "churned") return <Badge variant="outline" className="text-neutral-500">Baja</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default function ReferralsClient() {
  const [data, setData] = useState<MyReferral | null>(null);
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"code" | "url" | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [my, lb] = await Promise.all([
          api<MyReferral>("/referrals/my"),
          api<{ rows: LeaderRow[] }>("/referrals/leaderboard"),
        ]);
        setData(my);
        setLeaders(lb.rows);
      } catch (e: any) {
        toast.error(e?.message || "No se pudieron cargar los referidos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function copy(text: string, which: "code" | "url") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      toast.success(which === "code" ? "Código copiado" : "Enlace copiado");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("No se pudo copiar. Selecciona y usa Ctrl/Cmd+C.");
    }
  }

  async function shareNative() {
    if (!data) return;
    const message =
      `¡Únete a AIBA! Usa mi código ${data.code} al registrarte ` +
      `y me ayudas a mí a seguir mejorando la app 💚\n${data.share_url}`;
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: "AIBA",
          text: message,
          url: data.share_url,
        });
      } catch { /* user cancelled */ }
    } else {
      // Fallback: copy the whole message
      await copy(message, "url");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Gift className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Referidos</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Comparte tu código con otras profesionales. Cuando se registren y
            paguen su primer mes, ambas ganáis{" "}
            <span className="font-semibold text-primary">
              {data.reward_per_conversion_eur}€
            </span>{" "}
            de crédito.
          </p>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs">
              <Users className="h-3.5 w-3.5" /> Invitadas
            </div>
            <div className="text-2xl font-bold mt-1 tabular-nums">
              {data.invited_total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs">
              <TrendingUp className="h-3.5 w-3.5" /> Pagando
            </div>
            <div className="text-2xl font-bold mt-1 tabular-nums">
              {data.invited_paid}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-neutral-500 text-xs">
              📊 Conversión
            </div>
            <div className="text-2xl font-bold mt-1 tabular-nums">
              {data.conversion_rate_pct}%
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary text-xs font-medium">
              💰 Ganado
            </div>
            <div className="text-2xl font-bold mt-1 text-primary tabular-nums">
              {data.rewards_earned_eur.toLocaleString("es-ES", { minimumFractionDigits: 2 })}€
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Code card */}
      <Card>
        <CardHeader>
          <CardTitle>Tu código de referido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Code */}
          <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 px-6 py-8 flex flex-col items-center gap-3">
            <div className="text-3xl md:text-4xl font-bold tracking-widest text-primary select-all">
              {data.code}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copy(data.code, "code")}
              >
                {copied === "code" ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                Copiar código
              </Button>
              <Button size="sm" onClick={shareNative}>
                <Share2 className="h-4 w-4 mr-1.5" />
                Compartir
              </Button>
            </div>
          </div>

          {/* Share URL */}
          <div>
            <label className="text-xs text-neutral-500 uppercase tracking-wide">
              Enlace directo
            </label>
            <div className="flex gap-2 mt-1">
              <Input
                readOnly
                value={data.share_url}
                onFocus={(e) => e.currentTarget.select()}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                onClick={() => copy(data.share_url, "url")}
              >
                {copied === "url" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Quick share buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Únete a AIBA con mi código ${data.code}: ${data.share_url}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#25D366] text-white text-sm font-medium hover:opacity-90"
            >
              💬 WhatsApp
            </a>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(data.share_url)}&text=${encodeURIComponent(
                `Únete a AIBA con mi código ${data.code}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#229ED9] text-white text-sm font-medium hover:opacity-90"
            >
              ✈️ Telegram
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(
                "Te invito a AIBA"
              )}&body=${encodeURIComponent(
                `¡Hola! Te recomiendo AIBA para automatizar tus reservas. Usa mi código ${data.code} al registrarte:\n${data.share_url}\n\nCuando pagues tu primer mes ambas ganamos 20€ de crédito 💚`
              )}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              ✉️ Email
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Recent invited */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Historial de invitadas</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recent.length === 0 ? (
              <div className="text-sm text-neutral-500 py-6 text-center">
                Aún no has invitado a nadie. Comparte tu código para empezar 🚀
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {data.recent.map((r) => (
                  <li key={r.referral_id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {r.referred_business_name || r.referred_email || "—"}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {new Date(r.created_at).toLocaleDateString("es-ES", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </div>
                    </div>
                    {statusChip(r.status)}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Top embajadoras
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaders.length === 0 ? (
              <div className="text-sm text-neutral-500 py-6 text-center">
                Todavía no hay conversiones. ¡Sé la primera en el ranking!
              </div>
            ) : (
              <ol className="space-y-2">
                {leaders.map((r) => (
                  <li
                    key={r.user_id}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                      r.rank <= 3 ? "bg-amber-50 dark:bg-amber-500/10" : "bg-neutral-50 dark:bg-neutral-900"
                    }`}
                  >
                    <div
                      className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-bold ${
                        r.rank === 1
                          ? "bg-amber-500 text-white"
                          : r.rank === 2
                            ? "bg-neutral-400 text-white"
                            : r.rank === 3
                              ? "bg-orange-400 text-white"
                              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      {r.rank}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {r.business_name}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {r.paid_count} {r.paid_count === 1 ? "conversión" : "conversiones"}
                      </div>
                    </div>
                    {r.rank === 1 && <span className="text-lg">🏆</span>}
                    {r.rank === 2 && <span className="text-lg">🥈</span>}
                    {r.rank === 3 && <span className="text-lg">🥉</span>}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>Cómo funciona</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-full bg-primary text-white text-xs font-bold">1</span>
              <span>Comparte tu código o enlace con otra profesional que gestione citas.</span>
            </li>
            <li className="flex gap-3">
              <span className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-full bg-primary text-white text-xs font-bold">2</span>
              <span>Al registrarse escribiendo tu código, quedará vinculada como tu invitada.</span>
            </li>
            <li className="flex gap-3">
              <span className="h-6 w-6 flex-shrink-0 flex items-center justify-center rounded-full bg-primary text-white text-xs font-bold">3</span>
              <span>Cuando pague su primer mes de suscripción, recibes automáticamente{" "}
                <span className="font-semibold text-primary">
                  {data.reward_per_conversion_eur}€
                </span>{" "}
                de crédito en tu próxima factura.
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
