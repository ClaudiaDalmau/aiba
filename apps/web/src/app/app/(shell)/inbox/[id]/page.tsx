import { getT } from "@/i18n/server";
import Link from "next/link";
import { conversationAction, decideAction_, replyAction } from "@/actions/workspace";
import { SubmitButton } from "@/components/client";
import { Icon } from "@/components/icons";
import { Avatar, Badge, Button, ChannelIcon, cx, Textarea } from "@/components/ui";
import { getConversation } from "@/lib/queries";
import { ReplyBox } from "@/components/workspace/reply-box";
import { asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { currentTenant } from "@/lib/tenant";
import { formatDateTime, formatTime } from "@/lib/time";

export default async function Thread({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const { id } = await params;
  const tenant = await currentTenant();
  const c = await getConversation(tenant.business.id, id);
  const replies = await db.select({ id: schema.quickReplies.id, title: schema.quickReplies.title, body: schema.quickReplies.body }).from(schema.quickReplies).where(eq(schema.quickReplies.businessId, tenant.business.id)).orderBy(desc(schema.quickReplies.uses), asc(schema.quickReplies.title));
  const tz = tenant.business.timezone;
  type Item = { at: Date; kind: "msg"; m: (typeof c.messages)[number] } | { at: Date; kind: "act"; a: (typeof c.actions)[number] };
  const items: Item[] = [...c.messages.map((m) => ({ at: m.createdAt, kind: "msg" as const, m })), ...c.actions.map((a) => ({ at: a.createdAt, kind: "act" as const, a }))].sort((x, y) => x.at.getTime() - y.at.getTime());
  const name = c.customer?.name ?? (c.externalThreadId.startsWith("test:") ? t("Playground test") : t("Web visitor"));

  return (
    <div className="fixed inset-0 top-14 z-40 flex flex-col bg-surface lg:static lg:z-auto lg:min-h-0 lg:flex-1">
      <header className="flex items-center gap-3 border-b border-border px-5 py-3">
        <Link href="/app/inbox" className="lg:hidden"><Icon name="chevronLeft" /></Link>
        <Avatar name={name} size={34} color="#71717a" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-semibold">{name} <ChannelIcon channel={c.channel} /></div>
          <div className="truncate text-[12px] text-muted">
            {[c.customer?.phone, c.customer?.email].filter(Boolean).join(" · ") || c.channel}
            {c.customer && <> · <Link href={`/app/customers/${c.customer.id}`} className="underline-offset-2 hover:underline">profile</Link></>}
          </div>
        </div>
        <form action={conversationAction} className="flex gap-2">
          <input type="hidden" name="conversationId" value={c.id} />
          {c.humanTakeover ? (
            <Button name="action" value="release" variant="ai" size="sm" icon="sparkles">{t("Hand back to agent")}</Button>
          ) : (
            <Button name="action" value="takeover" variant="secondary" size="sm" icon="hand">{t("Take over")}</Button>
          )}
          {c.status !== "closed" ? <Button name="action" value="close" variant="ghost" size="sm">{t("Close")}</Button> : <Button name="action" value="reopen" variant="ghost" size="sm">{t("Reopen")}</Button>}
        </form>
      </header>

      {c.status === "escalated" && (
        <div className="flex items-center gap-2 border-b border-warn/20 bg-warn/10 px-5 py-2.5 text-[13px] text-warn">
          <Icon name="flag" size={15} /> {t("Escalated: {reason}. The agent is silent until you hand it back.", { reason: c.escalationReason ?? t("the agent asked for a human") })}
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-subtle/40 px-5 py-6">
        {items.map((it) =>
          it.kind === "msg" ? (
            it.m.role === "system" ? (
              <div key={it.m.id} className="text-center text-[12px] text-faint">{it.m.content} · {formatTime(it.m.createdAt, tz)}</div>
            ) : (
              <div key={it.m.id} className={cx("flex", it.m.role === "customer" ? "justify-start" : "justify-end")}>
                <div className={cx("max-w-[75%] rounded-2xl px-3.5 py-2 text-[14px] shadow-card", it.m.role === "customer" ? "rounded-bl-md bg-surface" : it.m.role === "agent" ? "rounded-br-md bg-ai/10 ring-1 ring-ai/20" : "rounded-br-md bg-accent text-accent-fg")}>
                  <div className="whitespace-pre-wrap">{it.m.content}</div>
                  <div className={cx("mt-1 text-[11px]", it.m.role === "owner" ? "opacity-60" : "text-faint")}>
                    {it.m.role === "agent" ? `✦ ${t("Agent")} · ` : it.m.role === "owner" ? `${t("You")} · ` : ""}{formatTime(it.m.createdAt, tz)}
                  </div>
                </div>
              </div>
            )
          ) : (
            <div key={it.a.id} className="flex justify-end">
              <div className="flex max-w-[75%] items-center gap-2 rounded-lg border border-dashed border-border bg-surface px-3 py-1.5 text-[12px] text-muted">
                <Icon name="bolt" size={13} className="text-ai" />
                <span>{it.a.summary || it.a.tool}</span>
                <Badge tone={it.a.status === "executed" || it.a.status === "approved" ? "ok" : it.a.status === "pending_approval" ? "warn" : it.a.status === "failed" || it.a.status === "rejected" ? "bad" : "neutral"}>{it.a.status.replace("_", " ")}</Badge>
                {it.a.status === "pending_approval" && (
                  <form action={decideAction_} className="flex gap-1">
                    <input type="hidden" name="actionId" value={it.a.id} />
                    <button name="decision" value="approve" className="rounded bg-accent px-2 py-0.5 text-accent-fg">{t("Approve")}</button>
                    <button name="decision" value="reject" className="rounded border border-border px-2 py-0.5">{t("Reject")}</button>
                  </form>
                )}
              </div>
            </div>
          ),
        )}
      </div>

      {c.channel === "web" && c.externalThreadId.startsWith("test:") ? (
        <div className="border-t border-border px-5 py-3 text-[13px] text-muted">{t("Playground conversation. Continue it from the Agent page.")}</div>
      ) : (
        <form action={replyAction} className="border-t border-border p-3">
          <input type="hidden" name="conversationId" value={c.id} />
          <ReplyBox replies={replies} customerName={c.customer?.name ?? ""} placeholder={c.humanTakeover ? t("Reply to the customer…") : t("Replying takes over the conversation from the agent…")} />
          <div className="mt-1.5 text-[11px] text-faint">{t("Sent via {channel}. Last activity {when}.", { channel: c.channel, when: formatDateTime(c.lastMessageAt, tz) })}</div>
        </form>
      )}
    </div>
  );
}
