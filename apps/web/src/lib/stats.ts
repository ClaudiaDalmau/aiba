import "server-only";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { zonedParts } from "./time";

/** Statistics for one business over a period, compared with the period just before. Aggregated in memory (≤ 1 year). */
export async function businessStats(business: schema.Business, days: number) {
  const now = Date.now();
  const from = new Date(now - days * 86400_000);
  const prevFrom = new Date(now - 2 * days * 86400_000);
  const rows = await db
    .select({ b: schema.bookings, service: schema.services.name, staff: schema.staff.name })
    .from(schema.bookings)
    .innerJoin(schema.services, eq(schema.services.id, schema.bookings.serviceId))
    .innerJoin(schema.staff, eq(schema.staff.id, schema.bookings.staffId))
    .where(and(eq(schema.bookings.businessId, business.id), gte(schema.bookings.startsAt, prevFrom), lt(schema.bookings.startsAt, new Date(now))));
  const firstVisit = await db.execute<{ customer_id: string; first: Date }>(
    // first non-cancelled appointment of each customer, to tell new from returning
    sql`select customer_id, min(starts_at) as first from bookings where business_id = ${business.id} and status <> 'cancelled' group by customer_id`,
  );
  const first = new Map(firstVisit.rows.map((r) => [r.customer_id, new Date(r.first).getTime()]));
  const packs = await db
    .select({ price: schema.customerPacks.priceCents, at: schema.customerPacks.createdAt })
    .from(schema.customerPacks)
    .where(and(eq(schema.customerPacks.businessId, business.id), gte(schema.customerPacks.createdAt, prevFrom)));
  const convs = await db
    .select({ at: schema.conversations.createdAt, esc: schema.conversations.escalationReason })
    .from(schema.conversations)
    .where(and(eq(schema.conversations.businessId, business.id), gte(schema.conversations.createdAt, prevFrom)));

  const empty = () => ({ revenue: 0, appointments: 0, completed: 0, cancelled: 0, noShow: 0, customers: new Set<string>(), newCustomers: new Set<string>(), packRevenue: 0, conversations: 0, escalated: 0, agentBooked: 0 });
  const cur = empty();
  const prev = empty();
  const services = new Map<string, { count: number; revenue: number }>();
  const staff = new Map<string, { count: number; revenue: number }>();
  const sources = new Map<string, number>();
  const weekday = Array(7).fill(0) as number[];
  const hours = Array(24).fill(0) as number[];

  for (const { b, service, staff: st } of rows) {
    const p = b.startsAt.getTime() >= from.getTime() ? cur : prev;
    const done = b.status === "completed" || b.status === "confirmed";
    if (b.status === "cancelled") p.cancelled++;
    else {
      p.appointments++;
      p.customers.add(b.customerId);
      if ((first.get(b.customerId) ?? 0) >= (p === cur ? from.getTime() : prevFrom.getTime())) p.newCustomers.add(b.customerId);
    }
    if (b.status === "completed") p.completed++;
    if (b.status === "no_show") p.noShow++;
    if (done) p.revenue += b.priceCents;
    if (["agent", "whatsapp", "telegram"].includes(b.source) && b.status !== "cancelled") p.agentBooked++;
    if (p !== cur || b.status === "cancelled") continue;
    const sv = services.get(service) ?? { count: 0, revenue: 0 };
    sv.count++;
    if (done) sv.revenue += b.priceCents;
    services.set(service, sv);
    const sf = staff.get(st) ?? { count: 0, revenue: 0 };
    sf.count++;
    if (done) sf.revenue += b.priceCents;
    staff.set(st, sf);
    sources.set(b.source, (sources.get(b.source) ?? 0) + 1);
    const z = zonedParts(b.startsAt, business.timezone);
    weekday[(z.weekday + 6) % 7]++;
    hours[Math.floor(z.minute / 60)]++;
  }
  for (const pk of packs) (pk.at.getTime() >= from.getTime() ? cur : prev).packRevenue += pk.price;
  for (const c of convs) {
    const p = c.at.getTime() >= from.getTime() ? cur : prev;
    p.conversations++;
    if (c.esc) p.escalated++;
  }
  const kpis = (p: typeof cur) => ({
    revenue: p.revenue + p.packRevenue,
    appointments: p.appointments,
    avgTicket: p.appointments - p.noShow > 0 ? Math.round(p.revenue / Math.max(1, p.appointments - p.noShow)) : 0,
    cancelRate: p.appointments + p.cancelled ? p.cancelled / (p.appointments + p.cancelled) : 0,
    noShowRate: p.appointments ? p.noShow / p.appointments : 0,
    customers: p.customers.size,
    newCustomers: p.newCustomers.size,
    packRevenue: p.packRevenue,
    conversations: p.conversations,
    agentResolution: p.conversations ? 1 - p.escalated / p.conversations : 0,
    agentBooked: p.agentBooked,
  });
  const sortMap = (m: Map<string, { count: number; revenue: number }>) => [...m.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue || b.count - a.count);
  return {
    current: kpis(cur),
    previous: kpis(prev),
    services: sortMap(services).slice(0, 8),
    staff: sortMap(staff),
    sources: [...sources.entries()].sort((a, b) => b[1] - a[1]),
    weekday,
    hours,
  };
}
