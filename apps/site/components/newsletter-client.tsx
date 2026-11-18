"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Send, Loader2, RefreshCw, Users, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

type Segment = "all" | "fieles" | "inactivos" | "cumpleaneros";
type Campaign = {
  campaign_id: string;
  subject: string;
  segment: string;
  status: string;
  recipients_count: number;
  sent: number;
  failures: number;
  created_at: string;
  test_only?: boolean;
  opens?: number;
  clicks?: number;
  bounces?: number;
  delivered?: number;
  complaints?: number;
};

async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    ...opts,
    credentials: "include",
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  return res.json();
}

const SEGMENT_LABELS: Record<Segment, string> = {
  all: "Todos los clientes",
  fieles: "Clientes fieles (3+ citas)",
  inactivos: "Inactivos (>90 días)",
  cumpleaneros: "Cumpleañeros del mes",
};

export default function NewsletterClient() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const [testEmail, setTestEmail] = useState("");
  const [counts, setCounts] = useState<Record<Segment, number> | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [c, list] = await Promise.all([
        api<Record<Segment, number>>("/newsletter/segments/preview"),
        api<Campaign[]>("/newsletter/campaigns/mine"),
      ]);
      setCounts(c);
      setCampaigns(list || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  async function send(isTest: boolean) {
    setError(null);
    setSuccess(null);
    if (!subject || subject.length < 3) return setError("Escribe un asunto (mín 3 caracteres)");
    if (!body || body.length < 10) return setError("El cuerpo del email es demasiado corto");
    if (isTest && !testEmail) return setError("Añade un email para el envío de prueba");
    setBusy(true);
    try {
      const res = await api<Campaign>("/newsletter/campaigns", {
        method: "POST",
        body: JSON.stringify({
          subject, body_md: body, segment,
          ...(isTest ? { test_email: testEmail } : {}),
        }),
      });
      setSuccess(`✅ ${res.sent} de ${res.recipients_count} enviados (${res.status})`);
      if (!isTest) {
        setSubject(""); setBody("");
      }
      await reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Mail className="h-6 w-6 text-emerald-600" /> Newsletter
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Envía campañas segmentadas a tus clientes por email.
          </p>
        </div>
        <button onClick={reload} className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl ring-1 ring-neutral-200 dark:ring-neutral-800 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-600" /> Nueva campaña
          </h2>

          {error && (
            <div className="p-3 mb-4 rounded-md bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm flex gap-2">
              <AlertCircle className="h-4 w-4 flex-none mt-0.5" /> {error}
            </div>
          )}
          {success && (
            <div className="p-3 mb-4 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm flex gap-2">
              <CheckCircle2 className="h-4 w-4 flex-none mt-0.5" /> {success}
            </div>
          )}

          <div className="mb-4 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-xs">
            💡 <b>Uso responsable:</b> el newsletter usa <b>Emergent Resend</b> (gestionado, sin API key). Solo envía a tus clientes reales, nunca a listas compradas. Los links deben ser <code>https://</code>. Los emails llevan un pie de firma con el nombre de tu negocio.
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Asunto</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Novedades de septiembre + 15% off en tratamientos"
                maxLength={200}
                className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Segmento</label>
              <div className="grid grid-cols-2 gap-2">
                {(["all", "fieles", "inactivos", "cumpleaneros"] as Segment[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSegment(s)}
                    className={`text-left p-3 rounded-md ring-1 transition ${
                      segment === s
                        ? "ring-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                        : "ring-neutral-200 dark:ring-neutral-800 hover:ring-neutral-400"
                    }`}
                  >
                    <div className="text-sm font-medium flex items-center justify-between">
                      <span>{SEGMENT_LABELS[s]}</span>
                      <span className="text-xs text-neutral-500">{counts?.[s] ?? "…"}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Mensaje</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder="Hola,&#10;&#10;Este mes tenemos novedades para ti…&#10;&#10;**En negrita** y *cursiva* funcionan. También [enlaces](https://…)."
                className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm font-mono"
              />
              <p className="text-xs text-neutral-500 mt-1">Markdown básico: **negrita**, *cursiva*, [enlace](url).</p>
            </div>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-800 mt-6 pt-4 space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[240px]">
                <label className="text-xs font-medium text-neutral-500 block mb-1">Envío de prueba (opcional)</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-3 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm"
                />
              </div>
              <button
                onClick={() => send(true)}
                disabled={busy || !testEmail}
                className="px-3 py-2 text-sm rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40"
              >
                Enviar prueba
              </button>
              <button
                onClick={() => send(false)}
                disabled={busy}
                className="px-4 py-2 text-sm rounded-md bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-2 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar a {counts?.[segment] ?? 0} destinatarios
              </button>
            </div>
          </div>
        </div>

        {/* Campaign history */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl ring-1 ring-neutral-200 dark:ring-neutral-800 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" /> Historial
          </h2>
          {campaigns.length === 0 ? (
            <p className="text-sm text-neutral-500">Aún no has enviado campañas.</p>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => {
                // Denominator falls back to recipients_count if `sent` is 0
                // (happens for queued_no_key campaigns before Resend key is set).
                const denom = c.sent || c.delivered || c.recipients_count || 0;
                const openRate = denom > 0 && c.opens ? Math.round((c.opens / denom) * 100) : 0;
                const clickRate = denom > 0 && c.clicks ? Math.round((c.clicks / denom) * 100) : 0;
                const hasMetrics = (c.opens ?? 0) > 0 || (c.clicks ?? 0) > 0 || (c.bounces ?? 0) > 0;
                return (
                  <div key={c.campaign_id} className="p-3 rounded-md ring-1 ring-neutral-200 dark:ring-neutral-800">
                    <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{c.subject}</div>
                    <div className="text-xs text-neutral-500 mt-1 flex items-center justify-between">
                      <span>{SEGMENT_LABELS[c.segment as Segment] || c.segment}</span>
                      <span className="inline-flex items-center gap-1">
                        {c.status === "sent" && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                        {c.status === "partial" && <AlertCircle className="h-3 w-3 text-amber-600" />}
                        {c.status === "queued_no_key" && (
                          <span className="text-amber-600" title="Se enviarán al desplegar (EMERGENT_EMAIL_KEY pendiente)">EN COLA</span>
                        )}
                        {c.status === "blocked_by_guardrail" && (
                          <span className="text-red-600" title="Bloqueado por reglas de seguridad">BLOQUEADO</span>
                        )}
                        {c.status.startsWith("sent_mocked") && <span className="text-amber-600">MOCKED</span>}
                        {c.sent}/{c.recipients_count}
                      </span>
                    </div>
                    {hasMetrics && (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                        <span title="Aperturas registradas por el proveedor de emails">
                          👀 <b>{c.opens ?? 0}</b> abr. <span className="text-neutral-400">({openRate}%)</span>
                        </span>
                        <span title="Clics en enlaces">
                          🔗 <b>{c.clicks ?? 0}</b> clics <span className="text-neutral-400">({clickRate}%)</span>
                        </span>
                        {(c.bounces ?? 0) > 0 && (
                          <span className="text-red-600" title="Rebotes (email no válido)">
                            ↩️ {c.bounces} rebotes
                          </span>
                        )}
                        {(c.complaints ?? 0) > 0 && (
                          <span className="text-amber-600" title="Spam / quejas">
                            ⚠️ {c.complaints} quejas
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-[10px] text-neutral-500 mt-1">
                      {new Date(c.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
