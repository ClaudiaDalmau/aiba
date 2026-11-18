import Link from "next/link";
import { decideAction_ } from "@/actions/workspace";
import { Icon } from "@/components/icons";
import { Avatar, Badge, BOOKING_LABEL, BOOKING_TONE, Button, Card, CardHeader, ChannelIcon, Empty, LinkButton, PageHeader, Stat } from "@/components/ui";
import { RevenueChart } from "@/components/workspace/revenue-chart";
import { getAgent } from "@/lib/agent/runtime";
import { businessMetrics } from "@/lib/metrics";
import { listActions, listBookings, listConversations } from "@/lib/queries";
import { currentTenant } from "@/lib/tenant";
import { addDays, formatMoney, formatTime, todayIn, zonedToUtc } from "@/lib/time";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Overview") };
}

export default async function Overview({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const t = await getT();
  const tenant = await currentTenant();
  const { welcome } = await searchParams;
  const tz = tenant.business.timezone;
  const today = todayIn(tz);
  const [m, todays, approvals, convs, agent] = await Promise.all([
    businessMetrics(tenant.business.id, 30),
    listBookings(tenant.business.id, { from: zonedToUtc(today, 0, tz), to: zonedToUtc(addDays(today, 1), 0, tz), status: ["pending", "confirmed", "completed", "no_show"] }),
    listActions(tenant.business.id, { status: "pending_approval", limit: 5 }),
    listConversations(tenant.business.id, { limit: 5 }),
    getAgent(tenant.business.id),
  ]);
  const money = (c: number) => formatMoney(c, tenant.business.currency);

  // Fill gaps so the chart has one bar per day (30 back, 14 ahead).
  const byDay = new Map(m.daily.map((d) => [d.day, d]));
  const days = Array.from({ length: 44 }, (_, i) => addDays(today, i - 29)).map((day) => byDay.get(day) ?? { day, bookings: 0, revenueCents: 0 });
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(new Date()));
  const greeting = hour < 12 ? t("Good morning") : hour < 18 ? t("Good afternoon") : t("Good evening");

  return (
    <>
      {welcome && (
        <Card className="animate-fade-up mb-6 overflow-hidden border-ai/30">
          <div className="flex flex-col gap-4 bg-ai/5 p-5 sm:flex-row sm:items-center">
            <div className="grid size-10 place-items-center rounded-full bg-ai text-white"><Icon name="sparkles" /></div>
            <div className="flex-1">
              <div className="font-semibold">{t("{name} is live", { name: agent?.name ?? t("Your assistant") })}</div>
              <p className="text-[14px] text-muted">{t("Your booking page is ready. Next: add services and FAQs, connect WhatsApp or Telegram, then publish.")}</p>
            </div>
            <div className="flex gap-2">
              <LinkButton href="/app/agent" variant="ai" size="sm" icon="sparkles">{t("Try your agent")}</LinkButton>
              <LinkButton href="/app/settings" variant="secondary" size="sm">{t("Publish page")}</LinkButton>
            </div>
          </div>
        </Card>
      )}

      <PageHeader
        eyebrow={new Intl.DateTimeFormat("es-ES", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(new Date())}
        title={`${greeting}, ${tenant.user.name.split(" ")[0]}`}
        description={todays.length ? t("You have {n} appointments today.", { n: todays.filter((b) => b.status !== "cancelled").length }) : t("No appointments today.")}
        actions={
          <>
            {!tenant.business.published && <Badge tone="warn" icon="eyeOff">{t("Booking page unpublished")}</Badge>}
            <LinkButton href="/app/bookings?new=1" icon="plus">{t("New booking")}</LinkButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("Revenue · 30 days")} value={money(m.revenueCents)} sub={t("{amount} booked ahead", { amount: money(m.upcomingRevenueCents) })} icon="chart" />
        <Stat label={t("Bookings · 30 days")} value={m.bookings} sub={t("{upcoming} upcoming · {cancelled} cancelled", { upcoming: m.upcoming, cancelled: m.cancellations })} icon="calendar" />
        <Stat label={t("Booked by your agent")} value={m.agentBookings} sub={m.bookings ? t("{pct}% of all bookings", { pct: Math.round((m.agentBookings / m.bookings) * 100) }) : "—"} icon="sparkles" tone="ai" />
        <Stat
          label={t("Agent resolution")}
          value={m.resolutionRate === null ? "—" : `${Math.round(m.resolutionRate * 100)}%`}
          sub={t("{conversations} conversations · {escalated} escalated", { conversations: m.conversations, escalated: m.escalated })}
          icon="checkCircle"
          tone="ai"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t("Revenue")} description={t("Last 30 days and the next two weeks already booked")} />
          <div className="px-5 pt-8 pb-4"><RevenueChart days={days} currency={tenant.business.currency} today={today} /></div>
        </Card>

        <Card>
          <CardHeader title={t("Needs your approval")} description={t("Sensitive actions your agent queued")} action={<Link href="/app/approvals" className="text-[13px] text-muted hover:text-fg">{t("All")}</Link>} />
          {approvals.length ? (
            <ul className="divide-y divide-border">
              {approvals.map((a) => (
                <li key={a.id} className="px-5 py-3.5">
                  <div className="text-[14px] font-medium">{a.summary}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
                    {a.channel && <ChannelIcon channel={a.channel} size={12} />} {a.customerName ?? t("Unknown customer")}
                  </div>
                  <form action={decideAction_} className="mt-2.5 flex gap-2">
                    <input type="hidden" name="actionId" value={a.id} />
                    <Button name="decision" value="approve" size="sm" icon="check">{t("Approve")}</Button>
                    <Button name="decision" value="reject" size="sm" variant="secondary">{t("Reject")}</Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon="checkCircle" title={t("All clear")}>{t("Nothing waiting for you.")}</Empty>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t("Today")} action={<Link href="/app/bookings" className="text-[13px] text-muted hover:text-fg">{t("Calendar")}</Link>} />
          {todays.length ? (
            <ul className="divide-y divide-border">
              {todays.map((b) => (
                <li key={b.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-14 text-[14px] font-semibold tabular-nums">{formatTime(b.startsAt, tz)}</div>
                  <span className="h-8 w-1 rounded-full" style={{ background: b.staff.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium">{b.customer.name}</div>
                    <div className="truncate text-[13px] text-muted">{b.service.name} · {b.staff.name}</div>
                  </div>
                  <Badge tone={BOOKING_TONE[b.status]}>{t(BOOKING_LABEL[b.status])}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon="calendar" title={t("A quiet day")}>{t("Share your booking page or let your agent fill the gaps.")}</Empty>
          )}
        </Card>

        <Card>
          <CardHeader title={t("Latest conversations")} action={<Link href="/app/inbox" className="text-[13px] text-muted hover:text-fg">{t("Inbox")}</Link>} />
          {convs.length ? (
            <ul className="divide-y divide-border">
              {convs.map((c) => (
                <li key={c.id}>
                  <Link href={`/app/inbox/${c.id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-subtle/60">
                    <Avatar name={c.customer?.name ?? t("Guest")} size={30} color="#71717a" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[14px] font-medium">
                        <span className="truncate">{c.customer?.name ?? t("Web visitor")}</span>
                        <ChannelIcon channel={c.channel} size={12} />
                        {c.status === "escalated" && <Badge tone="warn">{t("Needs you")}</Badge>}
                      </div>
                      <div className="truncate text-[13px] text-muted">{c.lastMessage}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon="chat" title={t("No conversations yet")}>{t("Connect WhatsApp or Telegram to let customers reach your agent.")}</Empty>
          )}
          <div className="border-t border-border px-5 py-3 text-[12px] text-muted">
            {t("Agent: {n} replies · avg {s}s", { n: m.agentTurns, s: (m.avgLatencyMs / 1000).toFixed(1) })} · {agent?.status === "active" ? <span className="text-ok">{t("online")}</span> : <span className="text-warn">{t("paused")}</span>}
          </div>
        </Card>
      </div>
    </>
  );
}
