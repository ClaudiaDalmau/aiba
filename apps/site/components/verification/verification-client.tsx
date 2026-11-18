"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck, AlertTriangle, Loader2, Plus, Search,
  CheckCircle2, XCircle, Info,
} from "lucide-react";
import { toast } from "sonner";

// -------------------- Types --------------------
type ReportTag =
  | "no_show"
  | "verbal_aggression"
  | "physical_aggression"
  | "payment_default"
  | "unwanted_contact_after_no";

type Report = {
  report_id: string;
  phone_hash: string;
  phone_last4: string;
  tag: ReportTag;
  created_at: string;
  expires_at: string;
  notify_after: string;
  notified_at: string | null;
  withdrawn_at: string | null;
};

type CheckResult = {
  flagged: boolean;
  reports_count: number;
  has_severe: boolean;
};

const TAG_LABEL: Record<ReportTag, string> = {
  no_show: "No presentado (no-show)",
  verbal_aggression: "Agresión verbal",
  physical_aggression: "Agresión física",
  payment_default: "Impago",
  unwanted_contact_after_no: "Contacto no deseado tras un no",
};

const TAGS: ReportTag[] = [
  "no_show",
  "payment_default",
  "unwanted_contact_after_no",
  "verbal_aggression",
  "physical_aggression",
];

// -------------------- API helpers --------------------
async function api<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    ...opts,
    headers: { "content-type": "application/json", ...(opts.headers || {}) },
  });
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) throw new Error((data && (data as { detail?: string }).detail) || `HTTP ${res.status}`);
  return data as T;
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return iso; }
}
function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

// -------------------- Component --------------------
export default function VerificationClient() {
  const [tab, setTab] = useState<"check" | "reports">("check");
  const [reports, setReports] = useState<Report[] | null>(null);

  // Check tab state
  const [checkPhone, setCheckPhone] = useState("");
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [checking, setChecking] = useState(false);

  // Report modal state
  const [reportOpen, setReportOpen] = useState(false);
  const [rPhone, setRPhone] = useState("");
  const [rTag, setRTag] = useState<ReportTag>("no_show");
  const [rConsent, setRConsent] = useState(false);
  const [rBusy, setRBusy] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      const list = await api<Report[]>("/verification/reports/mine");
      setReports(list);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, []);

  useEffect(() => { void loadReports(); }, [loadReports]);

  async function handleCheck(e?: React.FormEvent) {
    e?.preventDefault();
    if (!checkPhone.trim()) return;
    setChecking(true);
    setCheckResult(null);
    try {
      const r = await api<CheckResult>("/verification/check", {
        method: "POST",
        body: JSON.stringify({ phone: checkPhone.trim() }),
      });
      setCheckResult(r);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmitReport() {
    if (!rConsent) { toast.error("Debes aceptar los términos para reportar."); return; }
    if (!rPhone.trim()) { toast.error("Introduce un teléfono válido."); return; }
    setRBusy(true);
    try {
      await api("/verification/reports", {
        method: "POST",
        body: JSON.stringify({ phone: rPhone.trim(), tag: rTag, consent_accepted: true }),
      });
      toast.success("Reporte enviado. Caducará automáticamente en 365 días.");
      setReportOpen(false);
      setRPhone(""); setRTag("no_show"); setRConsent(false);
      await loadReports();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRBusy(false);
    }
  }

  async function withdraw(id: string) {
    if (!confirm("¿Retirar este reporte? Esta acción es permanente.")) return;
    try {
      await api(`/verification/reports/${id}/withdraw`, { method: "POST" });
      toast.success("Reporte retirado.");
      await loadReports();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-violet-600" />
            Verificación colaborativa
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
            Consulta si un teléfono ha sido reportado por otras profesionales o añade un reporte propio.
            Los reportes caducan automáticamente en 365 días.
          </p>
        </div>
        <button
          onClick={() => setReportOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-violet-600 hover:bg-violet-700 text-white shrink-0"
        >
          <Plus className="h-4 w-4" /> Nuevo reporte
        </button>
      </div>

      {/* RGPD info banner */}
      <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-200 dark:ring-amber-900/50 text-sm text-amber-900 dark:text-amber-200 flex gap-3">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Cumplimiento RGPD</p>
          <ul className="list-disc pl-4 space-y-0.5 text-xs">
            <li>Guardamos <strong>hash SHA-256 del teléfono</strong>, nunca el número en claro.</li>
            <li>Sólo <strong>5 etiquetas cerradas</strong>: sin texto libre sobre la persona.</li>
            <li>Un reporte por profesional y teléfono; puedes retirarlo si te equivocaste.</li>
            <li>Caducidad <strong>automática a los 365 días</strong>.</li>
            <li>Al reportar aceptas la <strong>cláusula de responsabilidad por veracidad</strong>.</li>
          </ul>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800 mb-4">
        <TabButton active={tab === "check"} onClick={() => setTab("check")}>Consultar teléfono</TabButton>
        <TabButton active={tab === "reports"} onClick={() => setTab("reports")}>
          Mis reportes {reports && `(${reports.length})`}
        </TabButton>
      </div>

      {tab === "check" && (
        <div>
          <form onSubmit={handleCheck} className="flex gap-2 mb-4">
            <input
              type="tel"
              value={checkPhone}
              onChange={(e) => setCheckPhone(e.target.value)}
              placeholder="+34 611 22 33 44"
              className="flex-1 px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm focus:ring-2 focus:ring-violet-500 outline-none"
            />
            <button
              type="submit"
              disabled={checking || !checkPhone.trim()}
              className="px-4 py-2 text-sm font-medium rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 inline-flex items-center gap-2 disabled:opacity-60"
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Consultar
            </button>
          </form>

          {checkResult && (
            <div
              className={`p-5 rounded-xl ring-1 ${
                !checkResult.flagged
                  ? "bg-emerald-50 dark:bg-emerald-950/30 ring-emerald-200 dark:ring-emerald-900/50"
                  : checkResult.has_severe
                    ? "bg-red-50 dark:bg-red-950/30 ring-red-200 dark:ring-red-900/50"
                    : "bg-amber-50 dark:bg-amber-950/30 ring-amber-200 dark:ring-amber-900/50"
              }`}
            >
              {!checkResult.flagged ? (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300">Sin reportes activos</p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300/80">Este teléfono no está en la base de verificación.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-6 w-6 ${checkResult.has_severe ? "text-red-600" : "text-amber-600"}`} />
                  <div>
                    <p className={`font-semibold ${checkResult.has_severe ? "text-red-900 dark:text-red-300" : "text-amber-900 dark:text-amber-300"}`}>
                      Teléfono reportado por {checkResult.reports_count} profesional{checkResult.reports_count > 1 ? "es" : ""}
                    </p>
                    <p className={`text-sm ${checkResult.has_severe ? "text-red-800 dark:text-red-300/80" : "text-amber-800 dark:text-amber-300/80"}`}>
                      {checkResult.has_severe
                        ? "Al menos un reporte de gravedad alta (agresión o impago). Considera medidas de precaución."
                        : "Considera pedir depósito completo o verificación adicional."}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                      No mostramos identidad de reporteros ni etiquetas específicas por respeto a la privacidad.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "reports" && (
        <div>
          {reports === null ? (
            <div className="py-16 text-center text-neutral-500"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-neutral-500 rounded-xl ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900">
              Aún no has creado ningún reporte.
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800/40">
                  <tr className="text-left text-neutral-500 dark:text-neutral-400">
                    <th className="px-4 py-2.5 font-medium">Teléfono</th>
                    <th className="px-4 py-2.5 font-medium">Motivo</th>
                    <th className="px-4 py-2.5 font-medium">Creado</th>
                    <th className="px-4 py-2.5 font-medium">Caduca</th>
                    <th className="px-4 py-2.5 font-medium text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {reports.map((r) => {
                    const dLeft = daysUntil(r.expires_at);
                    return (
                      <tr key={r.report_id}>
                        <td className="px-4 py-2.5">
                          <div className="font-mono text-xs">···· {r.phone_last4}</div>
                          <div className="text-[10px] text-neutral-400 font-mono truncate max-w-[130px]" title={r.phone_hash}>
                            hash: {r.phone_hash.slice(0, 8)}…
                          </div>
                        </td>
                        <td className="px-4 py-2.5"><TagBadge tag={r.tag} /></td>
                        <td className="px-4 py-2.5 text-neutral-500 dark:text-neutral-400 text-xs">{fmtDate(r.created_at)}</td>
                        <td className="px-4 py-2.5 text-xs">
                          <span className="text-neutral-700 dark:text-neutral-300">{fmtDate(r.expires_at)}</span>
                          <span className="ml-1 text-neutral-500">({dLeft}d)</span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button onClick={() => withdraw(r.report_id)} className="text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5" /> Retirar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Report modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => !rBusy && setReportOpen(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-lg ring-1 ring-neutral-200 dark:ring-neutral-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" /> Nuevo reporte
            </h3>
            <p className="text-xs text-neutral-500 mb-5">
              El reporte no será visible por otras profesionales de forma identificable — sólo el agregado.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  value={rPhone}
                  onChange={(e) => setRPhone(e.target.value)}
                  placeholder="+34 611 22 33 44"
                  disabled={rBusy}
                  className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Se convertirá en hash SHA-256 antes de guardarse. Nunca almacenamos el número en claro.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium block mb-1.5">Motivo</label>
                <select
                  value={rTag}
                  onChange={(e) => setRTag(e.target.value as ReportTag)}
                  disabled={rBusy}
                  className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm"
                >
                  {TAGS.map((t) => (
                    <option key={t} value={t}>{TAG_LABEL[t]}</option>
                  ))}
                </select>
              </div>

              <label className="flex gap-3 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer p-3 rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800">
                <input
                  type="checkbox"
                  checked={rConsent}
                  onChange={(e) => setRConsent(e.target.checked)}
                  className="mt-0.5 accent-violet-600"
                />
                <span>
                  Confirmo que el reporte es <strong>veraz</strong>, no soy la persona reportada, y acepto la
                  <strong> cláusula de responsabilidad</strong>: en caso de reportes falsos o difamatorios,
                  respondo personalmente ante la persona afectada. Entiendo que puedo retirar el reporte cuando quiera.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setReportOpen(false)} disabled={rBusy} className="px-3 py-2 text-sm rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                Cancelar
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={rBusy || !rConsent || !rPhone.trim()}
                className="px-4 py-2 text-sm rounded-md bg-violet-600 hover:bg-violet-700 text-white inline-flex items-center gap-2 disabled:opacity-60"
              >
                {rBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Enviar reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
        active
          ? "border-violet-600 text-violet-700 dark:text-violet-300"
          : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}

function TagBadge({ tag }: { tag: ReportTag }) {
  const severeSet = new Set<ReportTag>(["verbal_aggression", "physical_aggression", "payment_default"]);
  const severe = severeSet.has(tag);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
      severe
        ? "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300"
        : "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
    }`}>
      {TAG_LABEL[tag]}
    </span>
  );
}
