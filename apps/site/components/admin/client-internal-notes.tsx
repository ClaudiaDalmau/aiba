"use client";

/**
 * ClientInternalNotes — Iter96.
 *
 * Staff-only private notes attached to a client_id. Rendered inside
 * the report detail modal. Only admins + moderators can see + write.
 * The client themselves NEVER sees these notes.
 */

import { useCallback, useEffect, useState } from "react";
import { StickyNote, Loader2, Send, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";

type Note = {
  note_id: string;
  client_id: string;
  note: string;
  author_user_id: string;
  author_email?: string;
  author_business_name?: string;
  created_at: string;
  updated_at?: string;
  edit_count: number;
};

const rel = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
};

export default function ClientInternalNotes({
  clientId, currentUserId,
}: { clientId: string; currentUserId: string }) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [editText, setEditText] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch(
        `/api/backend/admin/clients/${encodeURIComponent(clientId)}/notes`,
        { cache: "no-store" },
      );
      if (r.ok) {
        const d = await r.json();
        setNotes(d.items || []);
      } else {
        setNotes([]);
      }
    } catch {
      setNotes([]);
    }
  }, [clientId]);

  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    try {
      const r = await fetch(
        `/api/backend/admin/clients/${encodeURIComponent(clientId)}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: text }),
        },
      );
      if (!r.ok) throw new Error((await r.json()).detail || "err");
      setDraft("");
      await load();
    } catch (e: any) {
      toast.error("No se pudo añadir la nota: " + (e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (n: Note) => {
    setEditing(n);
    setEditText(n.note);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const text = editText.trim();
    if (!text) return;
    setBusy(true);
    try {
      const r = await fetch(
        `/api/backend/admin/clients/notes/${editing.note_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: text }),
        },
      );
      if (!r.ok) throw new Error();
      setEditing(null);
      await load();
    } catch {
      toast.error("No se pudo editar la nota");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (n: Note) => {
    if (!confirm("¿Eliminar esta nota interna?")) return;
    setBusy(true);
    try {
      const r = await fetch(
        `/api/backend/admin/clients/notes/${n.note_id}`,
        { method: "DELETE" },
      );
      if (!r.ok) throw new Error();
      await load();
    } catch {
      toast.error("No se pudo eliminar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-neutral-50 dark:bg-neutral-950/40 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-neutral-200 dark:border-neutral-800">
        <StickyNote className="h-4 w-4 text-amber-600" />
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
          Notas internas del equipo
        </p>
        <span className="ml-auto text-[10px] text-neutral-500">
          🔒 solo staff · el cliente nunca las ve
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {notes === null ? (
          <div className="p-6 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
          </div>
        ) : notes.length === 0 ? (
          <p className="p-4 text-xs text-neutral-500 italic">
            Sin notas todavía. Escribe la primera abajo.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {notes.map((n) => {
              const isMine = n.author_user_id === currentUserId;
              const isEditing = editing?.note_id === n.note_id;
              return (
                <li key={n.note_id} className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex-none flex items-center justify-center text-white text-[10px] font-bold uppercase">
                      {(n.author_email?.[0] || "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                          {n.author_business_name || n.author_email || "staff"}
                          {isMine && <span className="ml-1 text-[9px] uppercase text-violet-500">tú</span>}
                        </span>
                        <span>·</span>
                        <span>{rel(n.created_at)}</span>
                        {n.edit_count > 0 && (
                          <span className="text-[9px] italic">editado {n.edit_count}×</span>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="mt-1 flex items-start gap-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value.slice(0, 2000))}
                            className="flex-1 text-sm p-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 min-h-[60px]"
                            autoFocus
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={saveEdit}
                              disabled={busy || !editText.trim()}
                              className="p-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-60"
                              aria-label="Guardar"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="p-1.5 rounded ring-1 ring-neutral-300 dark:ring-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                              aria-label="Cancelar"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-line mt-1">
                          {n.note}
                        </p>
                      )}
                    </div>
                    {!isEditing && isMine && (
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => startEdit(n)}
                          className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800"
                          title="Editar"
                        >
                          <Pencil className="h-3 w-3 text-neutral-500" />
                        </button>
                        <button
                          onClick={() => remove(n)}
                          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/40"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3 w-3 text-neutral-400 hover:text-red-500" />
                        </button>
                      </div>
                    )}
                    {!isEditing && !isMine && (
                      // Admins can also delete others' notes; try optimistically —
                      // backend enforces permission.
                      <button
                        onClick={() => remove(n)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950/40 opacity-40 hover:opacity-100"
                        title="Eliminar (solo admin)"
                      >
                        <Trash2 className="h-3 w-3 text-neutral-400 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
          placeholder="Añade una nota interna para el equipo…"
          className="flex-1 text-sm p-2 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 min-h-[60px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void create();
          }}
        />
        <button
          onClick={create}
          disabled={busy || !draft.trim()}
          className="p-2 rounded bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60"
          aria-label="Añadir nota"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
