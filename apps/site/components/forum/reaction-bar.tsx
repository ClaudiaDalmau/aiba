"use client";
import { useState } from "react";
import { EMOJIS, react } from "@/lib/forum-api";
import { toast } from "sonner";

export default function ReactionBar({
  targetType,
  targetId,
  counts,
  compact = false,
  onChange,
}: {
  targetType: "post" | "reply";
  targetId: string;
  counts: Record<string, number>;
  compact?: boolean;
  onChange?: () => void;
}) {
  const [local, setLocal] = useState<Record<string, number>>(counts);
  const [pending, setPending] = useState<string | null>(null);

  async function toggle(emoji: string) {
    if (pending) return;
    setPending(emoji);
    try {
      const res = await react(targetType, targetId, emoji);
      setLocal((prev) => ({
        ...prev,
        [emoji]: Math.max(0, (prev[emoji] || 0) + (res.reacted ? 1 : -1)),
      }));
      onChange?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Error: " + msg);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? "" : "mt-3"}`}>
      {EMOJIS.map((emoji) => {
        const n = local[emoji] || 0;
        return (
          <button
            key={emoji}
            onClick={() => toggle(emoji)}
            disabled={pending === emoji}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border transition ${
              n > 0
                ? "bg-violet-50 border-violet-200 dark:bg-violet-950 dark:border-violet-800"
                : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
            title={`${emoji} ${n}`}
          >
            <span>{emoji}</span>
            {n > 0 && <span className="text-xs font-semibold">{n}</span>}
          </button>
        );
      })}
    </div>
  );
}
