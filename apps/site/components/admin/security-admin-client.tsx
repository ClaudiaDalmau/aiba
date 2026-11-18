"use client";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import {
  Shield, Loader2, AlertTriangle, RefreshCw, Users, Lock, Activity,
  UserCog, ArrowRight, Download,
} from "lucide-react";
import SavedFilters from "@/components/saved-filters";

type Summary = {
  last_24h: { login_failures: number; lockouts_triggered: number; rate_limit_blocks: number };
  last_7d: {
    login_failures: number; refresh_replays: number; twofa_activations: number;
    password_changes: number; admin_actions: number; rate_limit_blocks: number;
  };
  now: {
    active_email_locks: number; twofa_adoption_pct: number;
    users_total: number; users_with_2fa: number;
  };
};

type AuditItem = {
  audit_id: string; action: string; actor_id: string | null;
  actor_email_hash: string | null; target_id: string | null;
  severity: "info" | "warning" | "critical";
  ip: string | null; user_agent: string | null; path: string | null;
  meta: any; created_at: string;
};

type RoleHistoryItem = {
  audit_id: string;
  created_at: string;
  ip: string | null;
  user_agent: string | null;
  actor: { user_id: string; email?: string; business_name?: string; full_name?: string } | null;
  target: { user_id: string; email?: string; business_name?: string; full_name?: string } | null;
  old_role: string;
  new_role: string;
  severity: string;
};

async function api<T>(path: string): Promise<T> {
  const r = await fetch(path, { cache: "no-store" });
  if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`);
  return r.json();
}

function KpiCard({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border p-4 bg-white">
      <div className="flex items-center gap-2 text-neutral-500 text-xs">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="text-[11px] text-neutral-500 mt-0.5">{hint}</div>}
    </div>
  );
}

function severityBadge(s: string) {
  const cls =
    s === "critical" ? "bg-red-100 text-red-700"
    : s === "warning" ? "bg-amber-100 text-amber-800"
    : "bg-neutral-100 text-neutral-700";
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>{s}</span>;
}

export default function SecurityAdminClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<AuditItem[]>([]);
  const [roleHistory, setRoleHistory] = useState<RoleHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionPrefix, setActionPrefix] = useState("");
  const [severity, setSeverity] = useState("");
  const [days, setDays] = useState(7);

  const load = useCallback(async () => {
    setRefreshing(true); setError(null);
    try {
      const [s, l, rh] = await Promise.all([
        api<Summary>("/api/admin/security/summary"),
        api<{ items: AuditItem[]; count: number }>(
          `/api/admin/security/audit-log?days=${days}&limit=200` +
          (actionPrefix ? `&action_prefix=${encodeURIComponent(actionPrefix)}` : "") +
          (severity ? `&severity=${encodeURIComponent(severity)}` : ""),
        ),
        api<{ items: RoleHistoryItem[]; count: number }>(
          "/api/admin/moderator/role-history?days=90&limit=25",
        ).catch(() => ({ items: [], count: 0 })),
      ]);
      setSummary(s);
      setRows(l.items);
      setRoleHistory(rh.items);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [actionPrefix, severity, days]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return (
    <main className="p-6 flex items-center gap-2 text-neutral-500">
      <Loader2 className="h-4 w-4 animate-spin" /> Cargando panel de seguridad…
    </main>
  );

  return (
    <main className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6 text-violet-600" /> Seguridad
          </h1>
          <p className="text-sm text-neutral-500">
            Panel de auditoría, bloqueos activos y métricas de defensa.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={refreshing}>
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refrescar
        </Button>
      </div>

      {error && (
        <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {summary && (
        <>
          <div>
            <h2 className="text-sm font-medium text-neutral-600 mb-2">Últimas 24 horas</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard icon={AlertTriangle} label="Login fallidos" value={summary.last_24h.login_failures} />
              <KpiCard icon={Lock} label="Bloqueos disparados" value={summary.last_24h.lockouts_triggered} />
              <KpiCard icon={Activity} label="Rate-limit hits" value={summary.last_24h.rate_limit_blocks} />
              <KpiCard icon={Lock} label="Cuentas bloqueadas ahora" value={summary.now.active_email_locks} />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-medium text-neutral-600 mb-2">Últimos 7 días</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard icon={AlertTriangle} label="Login fallidos" value={summary.last_7d.login_failures} />
              <KpiCard icon={Shield} label="Refresh replay detectados" value={summary.last_7d.refresh_replays} />
              <KpiCard icon={Shield} label="Activaciones 2FA" value={summary.last_7d.twofa_activations} />
              <KpiCard icon={AlertTriangle} label="Cambios de password" value={summary.last_7d.password_changes} />
              <KpiCard icon={Users} label="Acciones admin" value={summary.last_7d.admin_actions} />
              <KpiCard icon={Activity} label="Rate-limit hits" value={summary.last_7d.rate_limit_blocks} />
              <KpiCard
                icon={Shield}
                label="Adopción 2FA"
                value={`${summary.now.twofa_adoption_pct.toFixed(1)}%`}
                hint={`${summary.now.users_with_2fa}/${summary.now.users_total} usuarios`}
              />
            </div>
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-violet-600" /> Historial de roles (últimos 90d)
          </CardTitle>
          <CardDescription>
            Timeline visual de cambios de rol (Admin/Moderador/Usuario). Cada evento se
            registra con severidad crítica y queda auditado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roleHistory.length === 0 ? (
            <p className="text-sm text-neutral-500 py-4">
              Sin cambios de rol en los últimos 90 días.
            </p>
          ) : (
            <ol className="relative border-l border-neutral-200 dark:border-neutral-800 ml-3 space-y-4">
              {roleHistory.map((r) => (
                <li key={r.audit_id} className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-violet-500 ring-4 ring-violet-100 dark:ring-violet-950/50" />
                  <p className="text-xs text-neutral-500">
                    {new Date(r.created_at).toLocaleString("es-ES")}
                    {r.ip && <span className="ml-2 text-[10px] font-mono">· {r.ip}</span>}
                  </p>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                    {r.actor?.email || "—"}
                    <span className="text-neutral-400 font-normal"> cambió el rol de </span>
                    {r.target?.email || r.target?.user_id || "?"}
                  </p>
                  <p className="text-xs mt-0.5 flex items-center gap-1.5">
                    <RoleBadge role={r.old_role} />
                    <ArrowRight className="h-3 w-3 text-neutral-400" />
                    <RoleBadge role={r.new_role} highlight />
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>Audit log</CardTitle>
              <CardDescription>
                Filtra las últimas acciones críticas. Los emails están hasheados por privacidad.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <SavedFilters
                scope="audit-log"
                current={{ actionPrefix, severity, days }}
                onApply={(f) => {
                  if (typeof f?.actionPrefix === "string") setActionPrefix(f.actionPrefix);
                  if (typeof f?.severity === "string") setSeverity(f.severity);
                  if (typeof f?.days === "number") setDays(f.days);
                }}
                onDefaultLoaded={(f) => {
                  if (typeof f?.actionPrefix === "string") setActionPrefix(f.actionPrefix);
                  if (typeof f?.severity === "string") setSeverity(f.severity);
                  if (typeof f?.days === "number") setDays(f.days);
                }}
              />
              <a
                href={`/api/admin/security/audit-log.csv?days=${days}&limit=5000${
                  actionPrefix ? `&action_prefix=${encodeURIComponent(actionPrefix)}` : ""
                }${severity ? `&severity=${encodeURIComponent(severity)}` : ""}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
                title="Descargar el audit-log completo con los filtros actuales (UTF-8 con BOM, compatible con Excel)"
              >
                <Download className="h-3.5 w-3.5" /> Descargar CSV
              </a>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label htmlFor="action-prefix">Acción (prefijo)</Label>
              <Input id="action-prefix" placeholder="auth. / admin. / booking."
                     value={actionPrefix}
                     onChange={(e) => setActionPrefix(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="severity">Severidad</Label>
              <select
                id="severity"
                className="w-full rounded-md border border-neutral-200 bg-white h-9 text-sm px-2"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="">Todas</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="days">Días</Label>
              <Input id="days" type="number" min={1} max={90} value={days}
                     onChange={(e) => setDays(Math.max(1, Math.min(90, +e.target.value || 7)))} />
            </div>
            <div className="flex items-end">
              <Button onClick={load} disabled={refreshing}>
                {refreshing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Aplicar filtros
              </Button>
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600 text-xs">
                <tr>
                  <th className="text-left px-3 py-2">Cuando</th>
                  <th className="text-left px-3 py-2">Acción</th>
                  <th className="text-left px-3 py-2">Sev.</th>
                  <th className="text-left px-3 py-2">Actor</th>
                  <th className="text-left px-3 py-2">IP</th>
                  <th className="text-left px-3 py-2">Path</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-neutral-400">Sin eventos.</td></tr>
                )}
                {rows.map((r) => (
                  <tr key={r.audit_id} className="border-t hover:bg-neutral-50">
                    <td className="px-3 py-2 whitespace-nowrap text-neutral-500">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{r.action}</td>
                    <td className="px-3 py-2">{severityBadge(r.severity)}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-neutral-600">
                      {r.actor_id ? r.actor_id.slice(0, 8) : "—"}
                      {r.actor_email_hash && (
                        <span className="text-neutral-400"> · {r.actor_email_hash.slice(0, 6)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">{r.ip || "—"}</td>
                    <td className="px-3 py-2 text-xs text-neutral-500">{r.path || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-500">Mostrando {rows.length} eventos.</p>
        </CardContent>
      </Card>
    </main>
  );
}

function RoleBadge({ role, highlight = false }: { role: string; highlight?: boolean }) {
  const map: Record<string, { label: string; cls: string }> = {
    admin:     { label: "Admin",     cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 ring-amber-200 dark:ring-amber-800" },
    moderator: { label: "Moderador", cls: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 ring-sky-200 dark:ring-sky-800" },
    user:      { label: "Usuario",   cls: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 ring-neutral-200 dark:ring-neutral-700" },
  };
  const meta = map[role] || { label: role, cls: "bg-neutral-100 text-neutral-700 ring-neutral-200" };
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ring-1 ${meta.cls} ${highlight ? "ring-2" : ""}`}>
      {meta.label}
    </span>
  );
}
