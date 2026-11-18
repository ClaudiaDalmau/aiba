"use client";
import { useState } from "react";
import { ForumPoll, votePoll, closePoll } from "@/lib/forum-api";
import { BarChart2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function PollWidget({
  poll: initial,
  canClose,
}: {
  poll: ForumPoll;
  canClose: boolean;
}) {
  const [poll, setPoll] = useState<ForumPoll>(initial);
  const [pending, setPending] = useState(false);
  const isClosed = poll.is_closed || new Date(poll.closes_at).getTime() < Date.now();
  const totalVotes = poll.options.reduce((sum, o) => sum + o.vote_count, 0);
  const alreadyVoted = (poll.my_vote?.length ?? 0) > 0;

  async function vote(optionId: string) {
    if (isClosed || pending) return;
    setPending(true);
    try {
      const ids = poll.multi_choice
        ? (poll.my_vote?.includes(optionId)
            ? poll.my_vote.filter((x) => x !== optionId)
            : [...(poll.my_vote || []), optionId])
        : [optionId];
      if (!ids.length) return;
      const res = await votePoll(poll.poll_id, ids);
      setPoll({ ...res.poll, my_vote: res.my_vote });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    } finally {
      setPending(false);
    }
  }

  async function onClose() {
    if (!canClose) return;
    if (!confirm("¿Cerrar la encuesta ahora?")) return;
    try {
      await closePoll(poll.poll_id);
      setPoll({ ...poll, is_closed: true });
      toast.success("Encuesta cerrada");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    }
  }

  return (
    <div className="rounded-xl border border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/40 p-4 my-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart2 className="h-4 w-4 text-violet-600" />
        <p className="text-sm font-bold">{poll.question}</p>
        {isClosed && (
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            <Lock className="h-3 w-3" /> Cerrada
          </span>
        )}
      </div>
      <div className="space-y-2">
        {poll.options.map((o) => {
          const pct = totalVotes ? Math.round((o.vote_count / totalVotes) * 100) : 0;
          const selected = poll.my_vote?.includes(o.option_id);
          return (
            <button
              key={o.option_id}
              onClick={() => vote(o.option_id)}
              disabled={isClosed || pending}
              className={`relative w-full text-left px-3 py-2 rounded-lg overflow-hidden transition ${
                selected
                  ? "bg-violet-600 text-white"
                  : "bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              } ${isClosed ? "cursor-default" : "cursor-pointer"}`}
            >
              {(alreadyVoted || isClosed) && (
                <div
                  className="absolute inset-0 bg-violet-200/60 dark:bg-violet-800/40"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex justify-between items-center text-sm">
                <span className="font-medium">{o.text}</span>
                {(alreadyVoted || isClosed) && (
                  <span className="text-xs font-semibold">
                    {pct}% · {o.vote_count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
        <span>{poll.total_voters} votante{poll.total_voters === 1 ? "" : "s"} · {poll.multi_choice ? "Multi-elección" : "1 voto"}</span>
        {canClose && !isClosed && (
          <button onClick={onClose} className="text-red-600 hover:underline">
            Cerrar encuesta
          </button>
        )}
      </div>
    </div>
  );
}
