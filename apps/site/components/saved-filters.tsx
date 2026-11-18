"use client";

/**
 * SavedFilters — Iter94.
 *
 * Reusable dropdown for staff to save/load/share filter combinations.
 * The parent owns the filter *state* and passes:
 *   - `scope`      : namespace ("reports", "audit-log", ...).
 *   - `current`    : the current filter object (what "Guardar" persists).
 *   - `onApply(f)` : callback when the user clicks a saved filter.
 *
 * Filters storage is backed by `/api/staff/filters` (RBAC: admin+moderator).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookmarkPlus, Bookmark, ChevronDown, Trash2, Share2, Loader2, X,
  Check, Star,
} from "lucide-react";
import { toast } from "sonner";

type Filter = {
  filter_id: string;
  user_id: string;
  scope: string;
  name: string;
  filters: Record<string, any>;
  is_shared: boolean;
  is_default: boolean;
  slug: string | null;
  usage_count: number;
  last_used_at: string | null;
};

type Props = {
  scope: string;
  current: Record<string, any>;
  onApply: (filters: Record<string, any>) => void;
  /** Iter95: fired once on mount if a default filter exists (auto-load). */
  onDefaultLoaded?: (filters: Record<string, any>) => void;
  className?: string;
};

export default function SavedFilters({ scope, current, onApply, onDefaultLoaded, className }: Props) {
  const [mine, setMine] = useState<Filter[] | null>(null);
  const [shared, setShared] = useState<Filter[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveShared, setSaveShared] = useState(false);
  const [saveDefault, setSaveDefault] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const defaultLoadedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/backend/staff/filters?scope=${encodeURIComponent(scope)}`, { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        const myFilters: Filter[] = d.mine || [];
        setMine(myFilters);
        setShared(d.shared || []);
        // Iter95 — auto-load the default filter once on first mount.
        if (!defaultLoadedRef.current && onDefaultLoaded) {
          const def = myFilters.find((f) => f.is_default);
          if (def) {
            onDefaultLoaded(def.filters || {});
          }
          defaultLoadedRef.current = true;
        }
      } else {
        setMine([]);
      }
    } catch {
      setMine([]);
    }
  }, [scope, onDefaultLoaded]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const apply = async (f: Filter) => {
    onApply(f.filters || {});
    setOpen(false);
    // Fire and forget usage bump.
    try {
      await fetch(`/api/backend/staff/filters/${f.filter_id}/use`, {
        method: "POST", cache: "no-store",
      });
    } catch {
      // silent
    }
  };

  const save = async () => {
    const name = saveName.trim();
    if (!name) {
      toast.error("Ponle un nombre al filtro");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`/api/backend/staff/filters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope, name, filters: current,
          is_shared: saveShared,
          is_default: saveDefault,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).detail || "save_failed");
      toast.success(saveDefault
        ? "Filtro guardado como predeterminado"
        : "Filtro guardado");
      setShowSaveForm(false);
      setSaveName("");
      setSaveShared(false);
      setSaveDefault(false);
      await load();
    } catch (e: any) {
      toast.error(`No se pudo guardar: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleDefault = async (f: Filter, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (f.is_default) {
        const r = await fetch(`/api/backend/staff/filters/${f.filter_id}/default`, {
          method: "DELETE",
        });
        if (!r.ok) throw new Error();
        toast.success("Predeterminado desactivado");
      } else {
        const r = await fetch(`/api/backend/staff/filters/${f.filter_id}/default`, {
          method: "POST",
        });
        if (!r.ok) throw new Error();
        toast.success(`"${f.name}" ahora es tu filtro por defecto`);
      }
      await load();
    } catch {
      toast.error("No se pudo actualizar el predeterminado");
    }
  };

  const remove = async (f: Filter, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`¿Borrar el filtro "${f.name}"?`)) return;
    try {
      const r = await fetch(`/api/backend/staff/filters/${f.filter_id}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error();
      toast.success("Filtro eliminado");
      await load();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const copyShareLink = async (f: Filter, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!f.slug) return;
    const url = `${window.location.origin}${window.location.pathname}?shared_filter=${f.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado al portapapeles");
    } catch {
      toast.info(`Copia manualmente: ${url}`);
    }
  };

  const total = (mine?.length || 0) + shared.length;

  return (
    <div ref={rootRef} className={`relative ${className || ""}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200"
      >
        <Bookmark className="h-3.5 w-3.5" />
        Filtros guardados
        {total > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300">
            {total}
          </span>
        )}
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 max-h-96 overflow-y-auto rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900 shadow-lg z-40">
          <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Mis filtros</p>
            <button
              onClick={() => setShowSaveForm((v) => !v)}
              className="text-[11px] font-semibold text-violet-600 hover:underline flex items-center gap-1"
            >
              <BookmarkPlus className="h-3 w-3" />
              {showSaveForm ? "Cancelar" : "Guardar actual"}
            </button>
          </div>

          {showSaveForm && (
            <div className="p-3 bg-violet-50 dark:bg-violet-950/30 border-b border-neutral-200 dark:border-neutral-800 space-y-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value.slice(0, 80))}
                placeholder="Nombre del filtro (ej. spam-pendiente-7d)"
                className="w-full text-xs px-2 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
                onKeyDown={(e) => { if (e.key === "Enter") void save(); }}
              />
              <label className="flex items-center gap-2 text-[11px] cursor-pointer text-neutral-600 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={saveShared}
                  onChange={(e) => setSaveShared(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-neutral-300 text-violet-600"
                />
                Compartir con otros administradores
              </label>
              <label className="flex items-center gap-2 text-[11px] cursor-pointer text-neutral-600 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={saveDefault}
                  onChange={(e) => setSaveDefault(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-neutral-300 text-violet-600"
                />
                ⭐ Usar como predeterminado (se carga al entrar)
              </label>
              <button
                onClick={save}
                disabled={saving || !saveName.trim()}
                className="w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold rounded bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Guardar
              </button>
            </div>
          )}

          {mine === null ? (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
            </div>
          ) : mine.length === 0 ? (
            <p className="p-4 text-xs text-neutral-500">No tienes filtros guardados en esta pantalla.</p>
          ) : (
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {mine.map((f) => (
                <FilterRow key={f.filter_id} f={f} apply={apply} remove={remove}
                           copyShareLink={copyShareLink} toggleDefault={toggleDefault} owned />
              ))}
            </ul>
          )}

          {shared.length > 0 && (
            <>
              <div className="px-3 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Compartidos por el equipo
                </p>
              </div>
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {shared.map((f) => (
                  <FilterRow key={f.filter_id} f={f} apply={apply} remove={remove}
                             copyShareLink={copyShareLink} toggleDefault={toggleDefault} owned={false} />
                ))}
              </ul>
            </>
          )}

          <div className="px-3 py-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
            <button onClick={() => setOpen(false)} className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1">
              <X className="h-3 w-3" /> Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterRow({
  f, apply, remove, copyShareLink, toggleDefault, owned,
}: {
  f: Filter;
  apply: (f: Filter) => void;
  remove: (f: Filter, e: React.MouseEvent) => void;
  copyShareLink: (f: Filter, e: React.MouseEvent) => void;
  toggleDefault: (f: Filter, e: React.MouseEvent) => void;
  owned: boolean;
}) {
  return (
    <li
      onClick={() => apply(f)}
      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate flex items-center gap-1.5">
          {f.is_default && (
            <span
              title="Filtro por defecto — se carga al entrar"
              className="text-[9px] uppercase font-bold px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
            >
              DEFAULT
            </span>
          )}
          {f.name}
        </p>
        <p className="text-[10px] text-neutral-500 truncate">
          {Object.keys(f.filters || {}).slice(0, 4).map((k) => `${k}=${JSON.stringify(f.filters[k])}`).join(" · ")}
          {(f.usage_count > 0) && <span className="ml-2 text-neutral-400">· usado {f.usage_count}×</span>}
        </p>
      </div>
      {owned && (
        <button
          onClick={(e) => toggleDefault(f, e)}
          className="p-1 hover:bg-amber-100 dark:hover:bg-amber-950/50 rounded"
          title={f.is_default ? "Quitar de predeterminado" : "Marcar como predeterminado"}
        >
          <Star
            className={`h-3 w-3 ${
              f.is_default
                ? "fill-amber-400 text-amber-500"
                : "text-neutral-400"
            }`}
          />
        </button>
      )}
      {f.is_shared && f.slug && (
        <button
          onClick={(e) => copyShareLink(f, e)}
          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
          title="Copiar link compartible"
        >
          <Share2 className="h-3 w-3 text-neutral-500" />
        </button>
      )}
      {owned && (
        <button
          onClick={(e) => remove(f, e)}
          className="p-1 hover:bg-red-100 dark:hover:bg-red-950/50 rounded group"
          title="Borrar filtro"
        >
          <Trash2 className="h-3 w-3 text-neutral-400 group-hover:text-red-500" />
        </button>
      )}
    </li>
  );
}
