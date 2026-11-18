"use client";
/**
 * ReviewsModerationClient — Iter56 P2 Fase 2.2.
 *
 * Dashboard queue for public reviews. Split into tabs by moderation
 * status (Pending / Approved / Rejected / Hidden), with quick actions
 * (Approve / Reject / Hide) and an optional pro reply text box.
 *
 * Endpoints: /api/reviews-moderation + /stats + /{id}/{approve,reject,hide,reply}.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Shield, Star, CheckCircle2, XCircle, EyeOff, Eye, MessageSquareReply,
  AlertTriangle, Loader2, Trash2, Link2, Clock, ThumbsDown,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";

type ModerationStatus = "pending" | "approved" | "rejected" | "hidden";
type Filter = ModerationStatus | "all";

type ReviewItem = {
  review_id: string;
  stars: number;
  comment: string | null;
  client_name: string | null;
  sub_ratings: Record<string, number> | null;
  moderation_status: ModerationStatus | string;
  moderation_reason: string | null;
  pro_reply: string | null;
  pro_reply_at: string | null;
  booking_id: string;
  created_at: string;
};

type ListResp = { items: ReviewItem[]; total: number; filter: Filter };
type Stats = {
  pending: number; approved: number; rejected: number; hidden: number; total: number;
};

const REASON_LABELS: Record<string, { label: string; icon: React.ComponentType<{className?:string}>; color: string }> = {
  low_rating:     { label: "Puntuación baja",   icon: ThumbsDown,    color: "text-amber-600 dark:text-amber-400" },
  contains_url:   { label: "Contiene enlace",   icon: Link2,         color: "text-rose-600 dark:text-rose-400" },
  flagged_term:   { label: "Palabra bloqueada", icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400" },
  long_comment:   { label: "Comentario largo",  icon: MessageSquareReply, color: "text-neutral-600 dark:text-neutral-400" },
  manual_approve: { label: "Aprobado manual",   icon: CheckCircle2,  color: "text-emerald-600 dark:text-emerald-400" },
  manual_reject:  { label: "Rechazado manual",  icon: XCircle,       color: "text-rose-600 dark:text-rose-400" },
  manual_hide:    { label: "Oculto manual",     icon: EyeOff,        color: "text-neutral-600 dark:text-neutral-400" },
};

const TABS: { key: Filter; label: string }[] = [
  { key: "pending",  label: "Pendientes" },
  { key: "approved", label: "Publicadas" },
  { key: "rejected", label: "Rechazadas" },
  { key: "hidden",   label: "Ocultas" },
];

export default function ReviewsModerationClient() {
  const [filter, setFilter] = useState<Filter>("pending");
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [replyOpen, setReplyOpen] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        api<ListResp>(`/reviews-moderation?filter=${filter}&limit=50`),
        api<Stats>("/reviews-moderation/stats"),
      ]);
      setItems(list.items);
      setTotal(list.total);
      setStats(s);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`No se pudo cargar la cola: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { reload(); }, [reload]);

  const runAction = async (
    review_id: string,
    action: "approve" | "reject" | "hide",
  ) => {
    setBusyId(review_id);
    try {
      await api(`/reviews-moderation/${review_id}/${action}`, { method: "POST" });
      const msgs: Record<typeof action, string> = {
        approve: "Reseña publicada",
        reject: "Reseña rechazada (permanente)",
        hide: "Reseña ocultada del público",
      };
      toast.success(msgs[action]);
      await reload();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error: ${msg}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-violet-600" />
            <div>
              <CardTitle>Moderación de reseñas</CardTitle>
              <CardDescription>
                Revisa las reseñas antes de que aparezcan públicamente en tu landing.
                Las de 4-5 estrellas y sin enlaces se publican automáticamente.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <StatCell label="Pendientes"   value={stats.pending}  tone="amber" />
              <StatCell label="Publicadas"   value={stats.approved} tone="emerald" />
              <StatCell label="Rechazadas"   value={stats.rejected} tone="rose" />
              <StatCell label="Ocultas"      value={stats.hidden}   tone="neutral" />
              <StatCell label="Total"        value={stats.total}    tone="violet" />
            </div>
          ) : (
            <Skeleton className="h-16" />
          )}
        </CardContent>
      </Card>

      {/* Tabs + list */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-1 flex-wrap">
            {TABS.map((t) => {
              const count = stats ? stats[t.key as ModerationStatus] ?? 0 : 0;
              return (
                <Button
                  key={t.key}
                  size="sm"
                  variant={filter === t.key ? "default" : "outline"}
                  onClick={() => setFilter(t.key)}
                >
                  {t.label}
                  {count > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1.5 h-5 px-1.5 text-[10px]"
                    >
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <ul className="space-y-3">
              {items.map((r) => (
                <ReviewRow
                  key={r.review_id}
                  r={r}
                  busy={busyId === r.review_id}
                  isReplying={replyOpen === r.review_id}
                  onAction={(action) => runAction(r.review_id, action)}
                  onToggleReply={() => setReplyOpen((prev) => (prev === r.review_id ? null : r.review_id))}
                  onReplySaved={async () => {
                    setReplyOpen(null);
                    await reload();
                  }}
                />
              ))}
            </ul>
          )}
          {total > items.length && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-4">
              Mostrando {items.length} de {total}. Aumenta el filtro o ajusta la vista para ver más.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────

function StatCell({ label, value, tone }: { label: string; value: number; tone: "amber" | "emerald" | "rose" | "neutral" | "violet" }) {
  const bg: Record<typeof tone, string> = {
    amber:   "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300",
    emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300",
    rose:    "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300",
    neutral: "bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300",
    violet:  "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300",
  };
  return (
    <div className={`rounded-md p-3 ${bg[tone]}`}>
      <p className="text-xs uppercase tracking-widest font-bold opacity-80">{label}</p>
      <p className="text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const messages: Record<Filter, string> = {
    pending:  "🎉 No tienes reseñas pendientes. ¡Las que lleguen aparecerán aquí!",
    approved: "Aún no tienes reseñas publicadas.",
    rejected: "No has rechazado ninguna reseña.",
    hidden:   "No has ocultado ninguna reseña publicada.",
    all:      "Aún no hay reseñas.",
  };
  return (
    <div className="rounded-md border border-dashed border-neutral-200 dark:border-neutral-800 p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
      {messages[filter]}
    </div>
  );
}

function ReviewRow({
  r, busy, isReplying, onAction, onToggleReply, onReplySaved,
}: {
  r: ReviewItem;
  busy: boolean;
  isReplying: boolean;
  onAction: (a: "approve" | "reject" | "hide") => void;
  onToggleReply: () => void;
  onReplySaved: () => Promise<void>;
}) {
  const [replyDraft, setReplyDraft] = useState(r.pro_reply || "");
  const [savingReply, setSavingReply] = useState(false);
  const reason = r.moderation_reason ? REASON_LABELS[r.moderation_reason] : null;
  const isPending = r.moderation_status === "pending";
  const isApproved = r.moderation_status === "approved";

  const submitReply = async () => {
    if (replyDraft.trim().length < 2) {
      toast.error("La respuesta debe tener al menos 2 caracteres.");
      return;
    }
    setSavingReply(true);
    try {
      await api(`/reviews-moderation/${r.review_id}/reply`, {
        method: "POST",
        body: { reply: replyDraft.trim() },
      });
      toast.success("Respuesta publicada");
      await onReplySaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error: ${msg}`);
    } finally {
      setSavingReply(false);
    }
  };

  const clearReply = async () => {
    setSavingReply(true);
    try {
      await api(`/reviews-moderation/${r.review_id}/reply`, { method: "DELETE" });
      toast.success("Respuesta eliminada");
      setReplyDraft("");
      await onReplySaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Error: ${msg}`);
    } finally {
      setSavingReply(false);
    }
  };

  return (
    <li className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="flex items-start gap-3">
        <StarsBadge stars={r.stars} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
              {r.client_name || "Cliente anónimo"}
            </p>
            {reason && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${reason.color}`}>
                <reason.icon className="h-3 w-3" />
                {reason.label}
              </span>
            )}
            <span className="text-[10px] text-neutral-400">
              <Clock className="h-3 w-3 inline mr-0.5 -mt-0.5" />
              {new Date(r.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
            </span>
          </div>
          {r.comment ? (
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              &ldquo;{r.comment}&rdquo;
            </p>
          ) : (
            <p className="text-sm italic text-neutral-400">Sin comentario.</p>
          )}
          {r.pro_reply && !isReplying && (
            <div className="mt-3 pl-3 border-l-2 border-violet-500 bg-violet-50 dark:bg-violet-950/20 rounded-r py-2 pr-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-700 dark:text-violet-300 mb-1">
                Tu respuesta
              </p>
              <p className="text-sm text-violet-900 dark:text-violet-100 leading-relaxed">{r.pro_reply}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {isPending && (
          <>
            <Button size="sm" onClick={() => onAction("approve")} disabled={busy} data-testid={`approve-${r.review_id}`}>
              {busy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
              Aprobar y publicar
            </Button>
            <Button size="sm" variant="outline" onClick={() => onAction("reject")} disabled={busy} data-testid={`reject-${r.review_id}`}>
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Rechazar
            </Button>
          </>
        )}
        {isApproved && (
          <Button size="sm" variant="outline" onClick={() => onAction("hide")} disabled={busy}>
            <EyeOff className="h-3.5 w-3.5 mr-1" />
            Ocultar
          </Button>
        )}
        {(r.moderation_status === "rejected" || r.moderation_status === "hidden") && (
          <Button size="sm" variant="outline" onClick={() => onAction("approve")} disabled={busy}>
            <Eye className="h-3.5 w-3.5 mr-1" />
            Volver a publicar
          </Button>
        )}
        {isApproved && (
          <Button size="sm" variant="ghost" onClick={onToggleReply}>
            <MessageSquareReply className="h-3.5 w-3.5 mr-1" />
            {r.pro_reply ? "Editar respuesta" : "Responder"}
          </Button>
        )}
      </div>

      {isReplying && (
        <div className="mt-3 space-y-2">
          <textarea
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            placeholder="Tu respuesta pública a esta reseña…"
            maxLength={500}
            rows={3}
            className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-2 text-sm resize-y"
          />
          <div className="flex items-center gap-2 justify-end">
            <span className="text-[10px] text-neutral-400 mr-auto">{replyDraft.length}/500</span>
            {r.pro_reply && (
              <Button size="sm" variant="ghost" onClick={clearReply} disabled={savingReply}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Eliminar
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onToggleReply}>Cancelar</Button>
            <Button size="sm" onClick={submitReply} disabled={savingReply}>
              {savingReply ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
              Publicar respuesta
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function StarsBadge({ stars }: { stars: number }) {
  const bg = stars >= 4
    ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
    : stars === 3
      ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
      : "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300";
  return (
    <div className={`h-12 w-12 rounded-md flex flex-col items-center justify-center shrink-0 ${bg}`}>
      <Star className="h-4 w-4 fill-current" />
      <p className="text-sm font-black leading-none mt-0.5">{stars}</p>
    </div>
  );
}
