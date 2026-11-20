import { getT } from "@/i18n/server";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardHeader, PageHeader, cx } from "@/components/ui";
import { businessStats } from "@/lib/stats";
import { currentTenant, requirePermission } from "@/lib/tenant";
import { formatMoney } from "@/lib/time";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Statistics") };
}

const RANGES = [30, 90, 365] as const;

function Delta({ now, before, invert = false, pct = false }: { now: number; before: number; invert?: boolean; pct?: boolean }) {
  if (!before && !now) return null;
  const diff = pct ? Math.round((now - before) * 100) : before ? Math.round(((now - before) / before) * 100) : 100;
  if (!diff) return <span className="text-[12px] text-faint">=</span>;
  const good = invert ? diff < 0 : diff > 0;
  return <span className={cx("text-[12px] font-medium", good ? "text-ok" : "text-bad")}>{diff > 0 ? "▲" : "▼"} {Math.abs(diff)}{pct ? " pp" : "%"}</span>;
}

function Bars({ items, max, fmt }: { items: { label: string; value: number; sub?: string }[]; max: number; fmt?: (n: number) => string }) {
  return (
    <ul className="space-y-2.5 p-5">
      {items.map((it) => (
        <li key={it.label}>
          <div className="mb-1 flex justify-between gap-3 text-[13px]"><span className="truncate">{it.label}</span><span className="shrink-0 tabular-nums text-muted">{fmt ? fmt(it.value) : it.value}{it.sub ? ` · ${it.sub}` : ""}</span></div>
          <div className="h-2 rounded-full bg-subtle"><div className="h-2 rounded-full bg-ai" style={{ width: `${max ? Math.max(2, (it.value / max) * 100) : 0}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const t = await getT();
  const tenant = await currentTenant();
  requirePermission(tenant, "business.manage");
  const b = tenant.business;
  const want = (await searchParams).days;
  const days = RANGES.find((r) => String(r) === want) ?? 30;
  const s = await businessStats(b, days);
  const c = s.current;
  const p = s.previous;
  const money = (n: number) => formatMoney(n, b.currency);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const SOURCE: Record<string, string> = { web: t("Booking page"), owner: t("You / your team"), agent: t("Assistant (web chat)"), whatsapp: "WhatsApp", telegram: "Telegram" };
  const DAYS = [t("Mon"), t("Tue"), t("Wed"), t("Thu"), t("Fri"), t("Sat"), t("Sun")].map((d) => d.slice(0, 3));
  const kpi = (label: string, value: string | number, delta: ReactNode, sub?: string) => (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="text-[12px] font-medium text-muted">{label}</div>
      <div className="mt-1 flex items-baseline gap-2"><span className="text-[22px] font-semibold tabular-nums">{value}</span>{delta}</div>
      {sub && <div className="text-[12px] text-faint">{sub}</div>}
    </div>
  );
  const hourItems = s.hours.map((v, h) => ({ h, v })).filter((x) => x.v > 0);
  const hourMax = Math.max(1, ...s.hours);
  return (
    <>
      <PageHeader
        eyebrow={t("Day to day")}
        title={t("Statistics")}
        description={t("How your business is doing, compared with the previous period of the same length.")}
        actions={
          <div className="flex rounded-lg border border-border bg-surface p-0.5 text-[13px]">
            {RANGES.map((r) => (
              <Link key={r} href={`/app/stats?days=${r}`} className={cx("rounded-md px-3 py-1.5", r === days ? "bg-subtle font-medium" : "text-muted hover:text-fg")}>{r === 365 ? t("1 year") : t("{n} days", { n: r })}</Link>
            ))}
          </div>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpi(t("Revenue"), money(c.revenue), <Delta now={c.revenue} before={p.revenue} />, c.packRevenue ? t("incl. {amount} in packs", { amount: money(c.packRevenue) }) : undefined)}
        {kpi(t("Appointments"), c.appointments, <Delta now={c.appointments} before={p.appointments} />, t("average ticket {amount}", { amount: money(c.avgTicket) }))}
        {kpi(t("Customers"), c.customers, <Delta now={c.customers} before={p.customers} />, t("{n} new", { n: c.newCustomers }))}
        {kpi(t("Booked by your assistant"), c.agentBooked, <Delta now={c.agentBooked} before={p.agentBooked} />, c.conversations ? t("{pct} of chats solved without you", { pct: pct(c.agentResolution) }) : undefined)}
        {kpi(t("Cancellations"), pct(c.cancelRate), <Delta now={c.cancelRate} before={p.cancelRate} invert pct />)}
        {kpi(t("No-shows"), pct(c.noShowRate), <Delta now={c.noShowRate} before={p.noShowRate} invert pct />)}
        {kpi(t("Conversations"), c.conversations, <Delta now={c.conversations} before={p.conversations} />)}
        {kpi(t("Returning customers"), c.customers ? pct((c.customers - c.newCustomers) / c.customers) : "—", null)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("Top services")} description={t("by revenue")} />
          {s.services.length ? <Bars items={s.services.map((x) => ({ label: x.name, value: x.revenue, sub: t("{n} appts", { n: x.count }) }))} max={s.services[0].revenue} fmt={money} /> : <p className="p-5 text-[14px] text-muted">{t("No appointments in this period.")}</p>}
        </Card>
        <Card>
          <CardHeader title={t("Team")} />
          {s.staff.length ? <Bars items={s.staff.map((x) => ({ label: x.name, value: x.revenue, sub: t("{n} appts", { n: x.count }) }))} max={Math.max(...s.staff.map((x) => x.revenue))} fmt={money} /> : <p className="p-5 text-[14px] text-muted">{t("No appointments in this period.")}</p>}
        </Card>
        <Card>
          <CardHeader title={t("Where bookings come from")} />
          {s.sources.length ? <Bars items={s.sources.map(([k, v]) => ({ label: SOURCE[k] ?? k, value: v }))} max={s.sources[0][1]} /> : <p className="p-5 text-[14px] text-muted">{t("No appointments in this period.")}</p>}
        </Card>
        <Card>
          <CardHeader title={t("Busiest days and hours")} />
          <div className="space-y-5 p-5">
            <div className="flex h-28 items-end gap-2">
              {s.weekday.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-ai/80" style={{ height: `${(v / Math.max(1, ...s.weekday)) * 88}px` }} title={String(v)} />
                  <span className="text-[11px] text-muted">{DAYS[i]}</span>
                </div>
              ))}
            </div>
            {hourItems.length > 0 && (
              <div className="flex h-20 items-end gap-0.5">
                {Array.from({ length: Math.max(...hourItems.map((x) => x.h)) - Math.min(...hourItems.map((x) => x.h)) + 1 }, (_, i) => Math.min(...hourItems.map((x) => x.h)) + i).map((h) => (
                  <div key={h} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-ai/50" style={{ height: `${(s.hours[h] / hourMax) * 60}px` }} title={`${h}:00 · ${s.hours[h]}`} />
                    <span className="text-[10px] text-faint">{h}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
