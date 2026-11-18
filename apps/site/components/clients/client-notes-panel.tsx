"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Lock, Trash2, Plus, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

type NotesPayload = {
  client_id: string;
  content: string;
  tags: string[];
  updated_at: string | null;
};

const AUTOSAVE_MS = 900;
const MAX_CONTENT = 2000;
const MAX_TAGS = 8;

/**
 * Iter85 — Private per-pro client notes editor (Next.js).
 * Autosaves debounced. Only visible to the current pro.
 */
export function ClientNotesPanel({ clientId }: { clientId: string }) {
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<NotesPayload>(`/clients/${clientId}/notes`)
      .then((d) => {
        if (cancelled) return;
        setContent(d.content || "");
        setTags(d.tags || []);
        setUpdatedAt(d.updated_at);
      })
      .catch(() => {
        /* silent — no notes yet */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [clientId]);

  const scheduleSave = useCallback(
    (next: { content: string; tags: string[] }) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      dirtyRef.current = true;
      timerRef.current = setTimeout(async () => {
        if (!dirtyRef.current) return;
        dirtyRef.current = false;
        setSaving(true);
        try {
          const saved = await api<NotesPayload>(`/clients/${clientId}/notes`, {
            method: "PUT",
            body: next,
          });
          setTags(saved.tags);
          setUpdatedAt(saved.updated_at);
        } catch (e: any) {
          toast.error(e?.message || "No se pudo guardar la nota");
        } finally {
          setSaving(false);
        }
      }, AUTOSAVE_MS);
    },
    [clientId],
  );

  const addTag = () => {
    const cleaned = tagDraft.trim();
    if (!cleaned) return;
    if (tags.some((t) => t.toLowerCase() === cleaned.toLowerCase())) {
      setTagDraft("");
      return;
    }
    if (tags.length >= MAX_TAGS) {
      toast.error(`Máximo ${MAX_TAGS} etiquetas`);
      return;
    }
    const next = [...tags, cleaned].slice(0, MAX_TAGS);
    setTags(next);
    setTagDraft("");
    scheduleSave({ content, tags: next });
  };

  const removeTag = (t: string) => {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    scheduleSave({ content, tags: next });
  };

  const clearAll = async () => {
    if (!confirm("¿Borrar todas las notas de este cliente?")) return;
    try {
      await api(`/clients/${clientId}/notes`, { method: "DELETE" });
      setContent("");
      setTags([]);
      setUpdatedAt(null);
      toast.success("Notas eliminadas");
    } catch (e: any) {
      toast.error(e?.message || "Error");
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-violet-100 dark:border-violet-950/40 bg-violet-50/50 dark:bg-violet-950/20 p-3 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Cargando notas…</p>
      </div>
    );
  }

  const remaining = MAX_CONTENT - content.length;

  return (
    <div className="rounded-lg border border-violet-100 dark:border-violet-950/40 bg-violet-50/50 dark:bg-violet-950/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
          <p className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
            Notas privadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saving ? (
            <span className="text-[10px] italic text-neutral-500 dark:text-neutral-400">Guardando…</span>
          ) : updatedAt ? (
            <span className="text-[10px] italic text-emerald-600 dark:text-emerald-400">✓ Guardado</span>
          ) : null}
          {(content || tags.length > 0) && (
            <button
              onClick={clearAll}
              className="text-neutral-400 hover:text-red-600 p-0.5"
              aria-label="Borrar notas"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
        Solo tú puedes ver esto. Ideal para alergias, preferencias o recordatorios internos.
      </p>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => removeTag(t)}
              className="inline-flex items-center gap-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-full px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:text-neutral-200 hover:border-red-300 hover:text-red-600"
            >
              {t}
              <X className="h-2.5 w-2.5" />
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <input
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          maxLength={40}
          placeholder="Añadir etiqueta rápida…"
          className="flex-1 text-xs rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5 focus:outline-none focus:border-violet-400"
        />
        <button
          onClick={addTag}
          disabled={!tagDraft.trim()}
          className="w-7 h-7 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex items-center justify-center hover:border-violet-400 disabled:opacity-40"
          aria-label="Añadir etiqueta"
        >
          <Plus className="h-3.5 w-3.5 text-violet-600" />
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          scheduleSave({ content: e.target.value, tags });
        }}
        rows={3}
        maxLength={MAX_CONTENT}
        placeholder="Escribe cualquier cosa que quieras recordar…"
        className="w-full text-xs rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-2 leading-relaxed focus:outline-none focus:border-violet-400 resize-y min-h-[80px]"
      />
      <p
        className={`text-[10px] text-right ${
          remaining < 100 ? "text-amber-600" : "text-neutral-400 dark:text-neutral-500"
        }`}
      >
        {remaining} caracteres
      </p>
    </div>
  );
}
