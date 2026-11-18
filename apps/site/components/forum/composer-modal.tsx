"use client";
import { useState } from "react";
import { X, Loader2, Plus, BarChart2 } from "lucide-react";
import { createPost } from "@/lib/forum-api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export default function ComposerModal({
  channelId,
  channelName,
  canCreatePoll,
  open,
  onClose,
  onCreated,
}: {
  channelId: string;
  channelName: string;
  canCreatePoll: boolean;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollMulti, setPollMulti] = useState(false);
  const [pollDays, setPollDays] = useState(7);
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle(""); setBody(""); setTag(""); setTags([]);
    setShowPoll(false); setPollOptions(["", ""]);
    setPollMulti(false); setPollDays(7);
  }

  async function submit() {
    if (title.trim().length < 3) return toast.error("Título min. 3 caracteres");
    if (body.trim().length < 3) return toast.error("Cuerpo min. 3 caracteres");

    setSaving(true);
    try {
      const payload: any = { title, body, tags };
      if (showPoll) {
        const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
        if (opts.length < 2) return toast.error("Encuesta: min. 2 opciones") as any;
        payload.type = "poll";
        payload.poll = {
          question: title,
          options: opts,
          multi_choice: pollMulti,
          duration_days: pollDays,
        };
      }
      await createPost(channelId, payload);
      toast.success("Post publicado ✨");
      reset();
      onCreated();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  function addTag() {
    const t = tag.trim().toLowerCase();
    if (!t) return;
    if (tags.includes(t) || tags.length >= 5) return;
    setTags([...tags, t]);
    setTag("");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo post en <span className="text-violet-600">#{channelName}</span></DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-neutral-500">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Un título claro y directo"
              maxLength={140}
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900"
            />
            <p className="text-[10px] text-neutral-400 mt-0.5">{title.length}/140</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-500">Contenido</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe aquí. Usa @nombre para mencionar."
              rows={7}
              maxLength={10000}
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 font-mono"
            />
            <p className="text-[10px] text-neutral-400 mt-0.5">
              Soporta markdown básico. {body.length}/10000
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-500">Tags (máx. 5)</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-neutral-100 dark:bg-neutral-800"
                >
                  #{t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))} className="text-neutral-500 hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {tags.length < 5 && (
                <div className="flex items-center gap-1">
                  <input
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Nuevo tag"
                    className="px-2 py-0.5 text-xs rounded-full border border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 w-24"
                  />
                  <button onClick={addTag} className="text-neutral-500 hover:text-violet-600">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {canCreatePoll && (
            <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={showPoll}
                  onChange={(e) => setShowPoll(e.target.checked)}
                />
                <BarChart2 className="h-4 w-4 text-violet-500" /> Adjuntar encuesta
              </label>
              {showPoll && (
                <div className="mt-2 space-y-2">
                  {pollOptions.map((o, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={o}
                        onChange={(e) => {
                          const next = [...pollOptions];
                          next[i] = e.target.value;
                          setPollOptions(next);
                        }}
                        placeholder={`Opción ${i + 1}`}
                        className="flex-1 px-2 py-1 text-sm rounded border border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900"
                      />
                      {pollOptions.length > 2 && (
                        <button onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="text-red-500">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 10 && (
                    <button
                      onClick={() => setPollOptions([...pollOptions, ""])}
                      className="text-xs text-violet-600 hover:underline"
                    >
                      + Añadir opción
                    </button>
                  )}
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" checked={pollMulti} onChange={(e) => setPollMulti(e.target.checked)} />
                      Multi-elección
                    </label>
                    <label className="flex items-center gap-1">
                      Duración:
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={pollDays}
                        onChange={(e) => setPollDays(Number(e.target.value) || 7)}
                        className="w-14 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900"
                      />
                      días
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
