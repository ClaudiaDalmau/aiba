"use client";

import { useCallback, useEffect, useState } from "react";
import { Package, Plus, Trash2, Loader2, RefreshCw, Sparkles, TrendingUp } from "lucide-react";

type PackDef = {
  pack_def_id: string;
  name: string;
  service_id: string;
  service_name: string;
  sessions: number;
  price_eur: number;
  validity_days: number;
  description?: string;
  active: boolean;
  created_at: string;
};
type Service = { service_id: string; name: string };
type Analytics = {
  total_packs_sold: number;
  total_revenue_eur: number;
  sessions_sold: number;
  sessions_used: number;
  sessions_remaining: number;
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

export default function BonosClient() {
  const [defs, setDefs] = useState<PackDef[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [kpis, setKpis] = useState<Analytics | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState({ name: "", service_id: "", sessions: 5, price_eur: 150, validity_days: 365, description: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [d, s, k] = await Promise.all([
        api<PackDef[]>("/bonos/definitions/mine"),
        api<Service[]>("/services/mine"),
        api<Analytics>("/bonos/analytics/mine"),
      ]);
      setDefs(d || []);
      setServices(s || []);
      setKpis(k);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  async function createPack() {
    setError(null);
    setBusy(true);
    try {
      await api("/bonos/definitions", { method: "POST", body: JSON.stringify(form) });
      setOpenNew(false);
      setForm({ name: "", service_id: "", sessions: 5, price_eur: 150, validity_days: 365, description: "" });
      await reload();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(false); }
  }

  async function deletePack(id: string) {
    if (!confirm("¿Eliminar este pack?")) return;
    try {
      await api(`/bonos/definitions/${id}`, { method: "DELETE" });
      await reload();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-violet-600" /> Bonos y paquetes
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Vende packs de sesiones prepagadas para aumentar el LTV de tus clientes.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={reload} className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => setOpenNew(true)} className="px-3 py-2 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-sm inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nuevo pack
          </button>
        </div>
      </div>

      {error && <div className="p-3 mb-4 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>}

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Kpi label="Packs vendidos" value={kpis.total_packs_sold} icon={<Sparkles className="h-4 w-4" />} />
          <Kpi label="Ingresos" value={`${kpis.total_revenue_eur} €`} icon={<TrendingUp className="h-4 w-4" />} accent="emerald" />
          <Kpi label="Sesiones vendidas" value={kpis.sessions_sold} />
          <Kpi label="Sesiones consumidas" value={kpis.sessions_used} />
        </div>
      )}

      {/* MOCKED notice */}
      <div className="mb-6 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-sm">
        ⚠️ <b>Pagos MOCKED:</b> el cobro de los packs es offline hasta que actives Stripe/CCBill (Task M2, pendiente OÜ).
      </div>

      {/* List */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
        {defs.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-sm">
            Aún no has creado ningún pack. Empieza por definir uno.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/40 text-left text-neutral-500 text-xs">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Servicio</th>
                <th className="px-4 py-2 font-medium">Sesiones</th>
                <th className="px-4 py-2 font-medium">Precio</th>
                <th className="px-4 py-2 font-medium">Validez</th>
                <th className="px-4 py-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {defs.map((p) => (
                <tr key={p.pack_def_id}>
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400">{p.service_name}</td>
                  <td className="px-4 py-2.5">{p.sessions}</td>
                  <td className="px-4 py-2.5 font-semibold">{p.price_eur} €</td>
                  <td className="px-4 py-2.5 text-neutral-500">{p.validity_days}d</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => deletePack(p.pack_def_id)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {openNew && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => !busy && setOpenNew(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Nuevo pack</h3>
            <div className="space-y-3">
              <input className="w-full px-3 py-2 rounded-md border text-sm" placeholder="Nombre (ej. Bono 5 sesiones masaje)" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
              <select className="w-full px-3 py-2 rounded-md border text-sm" value={form.service_id} onChange={(e) => setForm({...form, service_id: e.target.value})}>
                <option value="">Selecciona servicio…</option>
                {services.map((s) => <option key={s.service_id} value={s.service_id}>{s.name}</option>)}
              </select>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" min={2} className="px-3 py-2 rounded-md border text-sm" placeholder="Sesiones" value={form.sessions} onChange={(e) => setForm({...form, sessions: Number(e.target.value)})} />
                <input type="number" min={0} step={0.01} className="px-3 py-2 rounded-md border text-sm" placeholder="Precio €" value={form.price_eur} onChange={(e) => setForm({...form, price_eur: Number(e.target.value)})} />
                <input type="number" min={7} className="px-3 py-2 rounded-md border text-sm" placeholder="Validez días" value={form.validity_days} onChange={(e) => setForm({...form, validity_days: Number(e.target.value)})} />
              </div>
              <textarea rows={2} className="w-full px-3 py-2 rounded-md border text-sm" placeholder="Descripción opcional" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setOpenNew(false)} className="px-3 py-2 text-sm rounded-md ring-1 ring-neutral-300">Cancelar</button>
              <button onClick={createPack} disabled={busy || !form.name || !form.service_id} className="px-3 py-2 text-sm rounded-md bg-violet-600 text-white disabled:opacity-60 inline-flex items-center gap-2">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, icon, accent = "neutral" }: { label: string; value: string | number; icon?: React.ReactNode; accent?: "neutral" | "emerald" }) {
  const cls = accent === "emerald" ? "text-emerald-700 dark:text-emerald-300" : "text-neutral-900 dark:text-neutral-100";
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
      <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium mb-1">{icon}{label}</div>
      <div className={`text-2xl font-bold ${cls}`}>{value}</div>
    </div>
  );
}
