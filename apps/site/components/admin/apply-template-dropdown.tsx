"use client";
/**
 * ApplyTemplateDropdown — Iter97 helper.
 *
 * Fetches templates matching the report's reason (or *all* active
 * templates in bulk mode) and lets the moderator apply one with a
 * single click, keeping the same undo affordance the rest of the
 * moderation queue enjoys.
 */
import { useEffect, useRef, useState } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

type Action = "approve" | "reject" | "ban";
type Template = {
  template_id: string;
  title: string;
  description?: string;
  action: Action;
  admin_notes_template: string;
  match_reasons: string[];
  is_active: boolean;
  usage_count: number;
};

const ACTION_BADGE: Record<Action, string> = {
  approve: "bg-emerald-100 text-emerald-800",
  reject: "bg-neutral-100 text-neutral-800",
  ban: "bg-red-100 text-red-800",
};

const ACTION_LABEL: Record<Action, string> = {
  approve: "Aprobar",
  reject: "Rechazar",
  ban: "Banear",
};

export type ApplyTemplateResult = {
  ok: number;
  noop: number;
  failed: number;
  action: Action;
  template_id: string;
  template_title: string;
};

type Props = {
  /** Optional report_id to fetch reason-scoped suggestions. */
  reportId?: string;
  /** Reports we intend to affect on click. */
  targetReportIds: string[];
  /** Called with the outcome so callers can render toasts / refresh lists. */
  onApplied: (result: ApplyTemplateResult) => void | Promise<void>;
  /** Compact variant (small pill) for the floating bulk toolbar. */
  compact?: boolean;
  /** Disables the trigger entirely (busy states, etc.). */
  disabled?: boolean;
};

export default function ApplyTemplateDropdown({
  reportId,
  targetReportIds,
  onApplied,
  compact = false,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Template[]>([]);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      if (reportId) {
        const r = await api<{ items: Template[] }>(
          `/admin/moderation-templates/suggest/${reportId}`,
        );
        setItems(r.items);
      } else {
        const r = await api<{ items: Template[] }>(
          "/admin/moderation-templates?include_inactive=false",
        );
        setItems(r.items.filter((t) => t.is_active));
      }
    } catch (err: unknown) {
      toast.error(
        "Error cargando plantillas: " +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setLoading(false);
    }
  };

  const toggle = async () => {
    if (disabled) return;
    if (!open) {
      setOpen(true);
      if (items.length === 0) await loadTemplates();
    } else {
      setOpen(false);
    }
  };

  const apply = async (tpl: Template) => {
    if (targetReportIds.length === 0) {
      toast.error("Selecciona al menos un reporte");
      return;
    }
    if (tpl.action === "ban") {
      const ok = confirm(
        `Esta plantilla BANEA a ${targetReportIds.length} cliente${
          targetReportIds.length !== 1 ? "s" : ""
        } y los añade a la blacklist. ¿Confirmar?`,
      );
      if (!ok) return;
    }
    setApplyingId(tpl.template_id);
    try {
      const r = await api<{ ok: number; noop: number; failed: number; action: Action }>(
        `/admin/moderation-templates/${tpl.template_id}/apply`,
        {
          method: "POST",
          body: { report_ids: targetReportIds },
        },
      );
      setOpen(false);
      await onApplied({ ...r, template_id: tpl.template_id, template_title: tpl.title });
    } catch (err: unknown) {
      toast.error(
        "Error aplicando plantilla: " +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setApplyingId(null);
    }
  };

  const triggerClass = compact
    ? `inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${
        disabled
          ? "bg-neutral-700 opacity-60 cursor-not-allowed"
          : "bg-violet-500 hover:bg-violet-600 text-white"
      }`
    : `inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-200 hover:bg-violet-100 dark:hover:bg-violet-950 ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={triggerClass}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {compact ? "Plantilla" : "Aplicar plantilla"}
      </button>

      {open && (
        <div
          className={`absolute z-50 ${compact ? "bottom-full mb-2 right-0" : "top-full mt-2 right-0"} w-80 max-h-[380px] overflow-y-auto rounded-lg shadow-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700`}
          role="menu"
        >
          <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                {reportId ? "Plantillas sugeridas" : "Plantillas activas"}
              </p>
              <p className="text-[10px] text-neutral-500">
                Aplica a {targetReportIds.length} reporte
                {targetReportIds.length !== 1 ? "s" : ""}
              </p>
            </div>
            <a
              href="/admin/moderation-templates"
              className="text-[10px] text-violet-600 hover:underline"
            >
              Gestionar
            </a>
          </div>

          {loading ? (
            <div className="p-6 flex items-center justify-center text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-500">
              <p>
                {reportId
                  ? "Sin plantillas para este motivo. "
                  : "Aún no hay plantillas activas. "}
                <a
                  href="/admin/moderation-templates"
                  className="text-violet-600 hover:underline"
                >
                  Crear una
                </a>
              </p>
            </div>
          ) : (
            <ul className="p-1">
              {items.map((tpl) => (
                <li key={tpl.template_id}>
                  <button
                    type="button"
                    onClick={() => apply(tpl)}
                    disabled={applyingId !== null}
                    className="w-full text-left px-2.5 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {tpl.title}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 italic line-clamp-1 mt-0.5">
                          {tpl.admin_notes_template}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${ACTION_BADGE[tpl.action]}`}
                        >
                          {ACTION_LABEL[tpl.action]}
                        </span>
                        {applyingId === tpl.template_id ? (
                          <Loader2 className="h-3 w-3 animate-spin text-violet-500" />
                        ) : tpl.usage_count > 0 ? (
                          <span className="text-[9px] text-neutral-400">
                            {tpl.usage_count} usos
                          </span>
                        ) : (
                          <Check className="h-3 w-3 text-neutral-300 opacity-0 group-hover:opacity-100" />
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
