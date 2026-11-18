"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Phone, Info, Loader2, Play } from "lucide-react";
import { toast } from "sonner";

type Settings = {
  user_id: string;
  enabled: boolean;
  twilio_phone_e164: string | null;
  greeting_prompt: string | null;
  transfer_number: string | null;
  language: string;
};

type Call = {
  call_id: string;
  from_number: string;
  direction: string;
  started_at: string;
  duration_s: number;
  status: string;
  transcript?: { role: string; text: string }[];
  booking_id?: string | null;
};

export default function AiPhoneClient() {
  const [s, setS] = useState<Settings | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [settings, callsResp] = await Promise.all([
          api<Settings>("/ai-phone/settings"),
          api<{ calls: Call[] }>("/ai-phone/calls"),
        ]);
        setS(settings);
        setCalls(callsResp.calls || []);
      } catch (e: any) {
        toast.error(e?.message || "No se pudo cargar la config de teléfono");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    if (!s) return;
    setSaving(true);
    try {
      const updated = await api<Settings>("/ai-phone/settings", { method: "PUT", body: s });
      setS(updated);
      toast.success("Configuración guardada");
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function testCall() {
    try {
      const r = await api<{ status: string; would_say?: string; message?: string }>(
        "/ai-phone/test-call",
        { method: "POST" }
      );
      if (r.status === "ready") {
        toast.success(`La IA diría: "${r.would_say?.slice(0, 80)}…"`);
      } else {
        toast.error(r.message || "Falta configuración");
      }
    } catch (e: any) {
      toast.error(e?.message || "Error");
    }
  }

  if (loading || !s) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Phone className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">Reserva por teléfono</h1>
            <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">
              Beta · Requiere Twilio
            </Badge>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Cuando un cliente llama a tu número, una IA responde, entiende
            lo que quiere y crea la reserva. Necesitas una cuenta Twilio activa
            (Account SID, Auth Token y un número comprado).
          </p>
        </div>
      </div>

      {/* Setup guide */}
      <Card className="bg-amber-50/50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" /> Configuración inicial (una sola vez)
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            1. Crea una cuenta en{" "}
            <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noreferrer" className="underline text-primary">
              Twilio
            </a>{" "}
            y compra un número (~1€/mes).
          </p>
          <p>
            2. En Twilio Console → Números → tu número → sección "Voice", configura el
            webhook <code className="bg-neutral-100 dark:bg-neutral-800 rounded px-1.5 py-0.5 font-mono text-xs">POST</code>{" "}
            hacia: <br />
            <code className="mt-1 inline-block bg-white dark:bg-neutral-900 border rounded px-2 py-1 text-xs font-mono select-all">
              https://aibookingassistant.app/api/ai-phone/webhook/incoming
            </code>
          </p>
          <p>
            3. Envía a soporte tu Auth Token para que activemos la firma
            criptográfica (nunca lo pegues aquí ni en Slack).
          </p>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de tu bot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
            <div>
              <p className="font-medium">Activar reservas por teléfono</p>
              <p className="text-xs text-neutral-500">Cuando esté desactivado, las llamadas se cuelgan educadamente.</p>
            </div>
            <Switch
              checked={s.enabled}
              onCheckedChange={(v) => setS({ ...s, enabled: v })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tw-num">Número Twilio (E.164)</Label>
            <Input
              id="tw-num"
              value={s.twilio_phone_e164 || ""}
              onChange={(e) => setS({ ...s, twilio_phone_e164: e.target.value })}
              placeholder="+34600123456"
            />
            <p className="text-xs text-neutral-500">
              Formato internacional con el prefijo del país.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tw-transfer">Número para transferir (opcional)</Label>
            <Input
              id="tw-transfer"
              value={s.transfer_number || ""}
              onChange={(e) => setS({ ...s, transfer_number: e.target.value })}
              placeholder="+34600111222"
            />
            <p className="text-xs text-neutral-500">
              Si la IA no entiende al cliente, se transferirá aquí.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tw-lang">Idioma principal</Label>
            <select
              id="tw-lang"
              value={s.language}
              onChange={(e) => setS({ ...s, language: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:ring-2 focus:ring-primary/40 outline-none"
            >
              <option value="es">Español</option>
              <option value="ca">Català</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tw-greeting">Saludo inicial (lo primero que dice)</Label>
            <textarea
              id="tw-greeting"
              rows={3}
              value={s.greeting_prompt || ""}
              onChange={(e) => setS({ ...s, greeting_prompt: e.target.value })}
              placeholder="Hola, soy la asistente virtual de..."
              className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:ring-2 focus:ring-primary/40 outline-none resize-y"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando…</> : "Guardar"}
            </Button>
            <Button variant="outline" onClick={testCall}>
              <Play className="h-4 w-4 mr-2" /> Probar saludo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Call history */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas llamadas</CardTitle>
        </CardHeader>
        <CardContent>
          {calls.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-8">
              Aún no hay llamadas. Aparecerán aquí cuando alguien llame a tu número.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {calls.map((c) => (
                <li key={c.call_id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{c.from_number}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(c.started_at).toLocaleString("es-ES")} · {c.duration_s}s
                      </p>
                    </div>
                    <Badge variant="outline">{c.status}</Badge>
                  </div>
                  {c.transcript && c.transcript.length > 0 && (
                    <div className="mt-2 space-y-1 text-xs">
                      {c.transcript.slice(0, 4).map((t, i) => (
                        <p key={i} className={t.role === "bot" ? "text-primary" : "text-neutral-600 dark:text-neutral-400"}>
                          <span className="font-medium">{t.role === "bot" ? "🤖" : "👤"}</span>{" "}
                          {t.text.slice(0, 120)}{t.text.length > 120 ? "…" : ""}
                        </p>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
