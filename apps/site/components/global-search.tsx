"use client";
/**
 * Iter72 — Global search command palette.
 *
 * Opens with ⌘K (Mac) / Ctrl+K (Win/Linux). Debounced search across bookings,
 * clients, services and forum posts. Grouped results, keyboard-navigable,
 * accessible.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, X, Calendar, Users, Wrench, MessageSquare, Loader2,
  CornerDownLeft, ArrowUp, ArrowDown, Command,
} from "lucide-react";

type Result = {
  type: "booking" | "client" | "service" | "forum";
  id: string;
  title: string;
  subtitle: string;
  date?: string | null;
  status?: string;
  price_eur?: number;
  route: string;
};

type Grouped = {
  bookings?: Result[];
  clients?: Result[];
  services?: Result[];
  forum?: Result[];
};

const TYPE_META: Record<Result["type"], { label: string; icon: any; color: string }> = {
  booking: { label: "Reservas",  icon: Calendar,        color: "text-emerald-600" },
  client:  { label: "Clientes",  icon: Users,           color: "text-blue-600" },
  service: { label: "Servicios", icon: Wrench,          color: "text-fuchsia-600" },
  forum:   { label: "Foro",      icon: MessageSquare,   color: "text-violet-600" },
};

const GROUP_ORDER: (keyof Grouped)[] = ["bookings", "clients", "services", "forum"];

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [grouped, setGrouped] = useState<Grouped>({});
  const [flat, setFlat] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Keyboard: ⌘K / Ctrl+K to open, Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Autofocus on open
  useEffect(() => {
    if (open) {
      setActiveIdx(0);
      // Delay so the input is mounted
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      setQ("");
      setFlat([]);
      setGrouped({});
    }
  }, [open]);

  // Debounced backend query
  useEffect(() => {
    if (!open) return;
    const query = q.trim();
    if (query.length < 2) {
      setFlat([]);
      setGrouped({});
      setLoading(false);
      return;
    }
    const t = setTimeout(async () => {
      // Abort in-flight requests to avoid out-of-order results
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const r = await fetch(
          `/api/backend/search?q=${encodeURIComponent(query)}`,
          { signal: ctrl.signal, cache: "no-store" },
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        setGrouped(data.grouped || {});
        setFlat(data.results || []);
        setActiveIdx(0);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setFlat([]);
          setGrouped({});
        }
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q, open]);

  const navigate = useCallback((result: Result) => {
    setOpen(false);
    router.push(result.route);
  }, [router]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!flat.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = flat[activeIdx];
      if (r) navigate(r);
    }
  }, [flat, activeIdx, navigate]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-result-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const showEmpty = !loading && q.trim().length >= 2 && flat.length === 0;
  const showHint = q.trim().length < 2;

  return (
    <>
      <SearchTrigger onOpen={() => setOpen(true)} />

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Búsqueda global"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[10vh] px-4"
          onMouseDown={(e) => {
            // Click outside the panel closes
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 border-b border-neutral-200 dark:border-neutral-800">
              <Search className="h-4 w-4 text-neutral-400 dark:text-neutral-500 shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Buscar reservas, clientes, servicios, foro…"
                className="flex-1 py-3.5 bg-transparent outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 text-sm"
                aria-label="Consulta de búsqueda"
                aria-controls="global-search-results"
                aria-activedescendant={
                  flat[activeIdx] ? `search-result-${activeIdx}` : undefined
                }
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar búsqueda"
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              </button>
            </div>

            {/* Results / hint / empty */}
            <div
              id="global-search-results"
              ref={listRef}
              className="max-h-[60vh] overflow-y-auto"
              role="listbox"
            >
              {showHint && (
                <div className="px-6 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  <p>Escribe al menos 2 caracteres para buscar.</p>
                  <p className="text-xs mt-2 text-neutral-400 dark:text-neutral-500">
                    Cliente · servicio · palabra en un post del foro… todo funciona.
                  </p>
                </div>
              )}
              {showEmpty && (
                <div className="px-6 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  Sin resultados para «{q}».
                </div>
              )}
              {!showHint && !showEmpty && (
                <div className="py-2">
                  {GROUP_ORDER.map((groupKey) => {
                    const items = grouped[groupKey] || [];
                    if (items.length === 0) return null;
                    return (
                      <SearchGroup
                        key={groupKey}
                        groupKey={groupKey}
                        items={items}
                        flat={flat}
                        activeIdx={activeIdx}
                        onSelect={navigate}
                        onHover={setActiveIdx}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer with keyboard hints */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-950/50">
              <KbdHint icon={<ArrowUp className="h-3 w-3" />} label="Subir">
                <ArrowDown className="h-3 w-3" />
              </KbdHint>
              <KbdHint icon={<CornerDownLeft className="h-3 w-3" />} label="Abrir" />
              <KbdHint label="Cerrar">Esc</KbdHint>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform));
  }, []);
  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-xs"
      aria-label="Abrir búsqueda global"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Buscar…</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
        {isMac ? <Command className="h-2.5 w-2.5" /> : "Ctrl"}K
      </kbd>
    </button>
  );
}

function SearchGroup({
  groupKey, items, flat, activeIdx, onSelect, onHover,
}: {
  groupKey: keyof Grouped;
  items: Result[];
  flat: Result[];
  activeIdx: number;
  onSelect: (r: Result) => void;
  onHover: (i: number) => void;
}) {
  const label =
    groupKey === "bookings" ? "Reservas"
    : groupKey === "clients" ? "Clientes"
    : groupKey === "services" ? "Servicios"
    : "Foro";
  return (
    <div className="px-2 pb-1">
      <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        {label} · {items.length}
      </p>
      {items.map((it) => {
        const idx = flat.indexOf(it);
        const active = idx === activeIdx;
        const meta = TYPE_META[it.type];
        const Icon = meta.icon;
        return (
          <button
            key={`${it.type}-${it.id}`}
            id={`search-result-${idx}`}
            data-result-idx={idx}
            role="option"
            aria-selected={active}
            onMouseEnter={() => onHover(idx)}
            onClick={() => onSelect(it)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left ${
              active
                ? "bg-violet-50 dark:bg-violet-950/40 text-neutral-900 dark:text-neutral-100"
                : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-800 dark:text-neutral-200"
            }`}
          >
            <div className={`h-8 w-8 rounded-md flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 shrink-0 ${meta.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{it.title}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{it.subtitle}</p>
            </div>
            {active && (
              <CornerDownLeft className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function KbdHint({
  icon, label, children,
}: {
  icon?: React.ReactNode;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1">
      {icon}
      {children && (
        <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-[10px] font-mono">
          {children}
        </kbd>
      )}
      <span>{label}</span>
    </div>
  );
}
