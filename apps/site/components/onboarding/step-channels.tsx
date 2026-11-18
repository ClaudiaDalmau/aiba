"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, Copy, ExternalLink, MessageCircle } from "lucide-react";
import { toast } from "sonner";

type Meta = {
  telegram_bot_username?: string | null;
  telegram_invite_code?: string | null;
  telegram_deeplink?: string | null;
  pro_telegram_chat_id?: number | null;
  is_sensitive_vertical: boolean;
};

export default function StepChannels({
  meta, initialWhatsapp, onBack, onFinish, saving,
}: {
  meta: Meta;
  initialWhatsapp: string;
  onBack: () => void;
  onFinish: (v: { whatsapp_number: string | null; telegram_opened: boolean }) => Promise<void>;
  saving: boolean;
}) {
  const [wa, setWa] = useState(initialWhatsapp);
  const [telegramOpened, setTelegramOpened] = useState<boolean>(!!meta.pro_telegram_chat_id);
  const [error, setError] = useState<string | null>(null);

  const inviteCode = meta.telegram_invite_code || "";
  const deeplink = meta.telegram_deeplink;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast.success("Código copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = wa.trim();
    if (value && !/^\+?[0-9\s-]{6,25}$/.test(value)) {
      return setError("Número WhatsApp inválido (formato +34…)");
    }
    onFinish({
      whatsapp_number: value ? value : null,
      telegram_opened: telegramOpened || !!meta.pro_telegram_chat_id,
    });
  };

  const linked = !!meta.pro_telegram_chat_id;

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <MessageCircle className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Canales de reserva</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
            Conecta Telegram (imprescindible) para recibir reservas por chat. WhatsApp es opcional.
          </p>
        </div>
      </div>

      {/* Telegram card */}
      <div className={`rounded-xl border-2 ${linked ? "border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-500/10" : "border-primary/40 bg-primary/5"} p-5 space-y-4`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">✈️</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold flex items-center gap-2">
              Telegram bot
              {linked && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Conectado
                </span>
              )}
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
              Tus clientes conversarán con este bot para reservar. Enlaza tu Telegram personal
              como administrador — solo se hace una vez.
            </p>
          </div>
        </div>

        {!linked && (
          <>
            <div className="rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 px-4 py-3 space-y-3">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">1</span>
                <p className="text-sm">Abre el bot en Telegram con este enlace directo:</p>
              </div>

              {deeplink && (
                <a
                  href={deeplink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setTelegramOpened(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#229ED9] hover:bg-[#1e90c7] text-white px-4 py-2 text-sm font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir @{meta.telegram_bot_username || "bot"}
                </a>
              )}

              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">2</span>
                <div className="min-w-0">
                  <p className="text-sm">Si no se abre solo, escribe manualmente al bot este comando:</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-1 text-xs font-mono">
                      /start link_{inviteCode}
                    </code>
                    <Button type="button" variant="outline" size="sm" onClick={copyCode}>
                      <Copy className="h-3.5 w-3.5 mr-1" /> Código
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">3</span>
                <p className="text-sm">
                  El bot te confirmará al instante. Refresca esta página para ver el estado.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={telegramOpened}
                onChange={(e) => setTelegramOpened(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm">Ya lo hice (o lo haré después)</span>
            </label>
          </>
        )}

        {linked && (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Tu Telegram está conectado (chat_id <code className="font-mono text-xs">{meta.pro_telegram_chat_id}</code>).
            El bot ya puede reenviarte las conversaciones de tus clientes.
          </p>
        )}
      </div>

      {/* WhatsApp card (skip for sensitive vertical) */}
      {!meta.is_sensitive_vertical && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💬</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">WhatsApp (opcional)</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Comparte tu número para que los clientes puedan escribirte por WhatsApp
                desde tu página pública. Puedes dejarlo vacío ahora y añadirlo luego.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ob-wa">Número WhatsApp</Label>
            <Input
              id="ob-wa"
              value={wa}
              onChange={(e) => setWa(e.target.value)}
              placeholder="+34 600 123 456"
              disabled={saving}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Button type="button" variant="ghost" onClick={onBack} disabled={saving}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Atrás
        </Button>
        <Button type="submit" disabled={saving} size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Terminando…</>
          ) : (
            <>Ir al dashboard <CheckCircle2 className="h-4 w-4 ml-2" /></>
          )}
        </Button>
      </div>
    </form>
  );
}
