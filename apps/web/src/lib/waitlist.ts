import "server-only";
import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSlots } from "./availability";
import { badRequest } from "./errors";
import { newId } from "./ids";
import { getSettings } from "./settings";
import { todayIn } from "./time";

/**
 * Waitlist for full days: customers ask to be told if a slot frees up. When a booking is cancelled or
 * moved away from a day, the first people waiting for that day (and service) get a message with the link.
 * First to book wins; nobody is booked automatically.
 */

const NOTIFY_AT_ONCE = 3;

export async function joinWaitlist(businessId: string, input: { customerId: string; serviceId: string; staffId?: string | null; date: string; source: string }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw badRequest("Pick a valid day");
  const [biz] = await db.select({ tz: schema.businesses.timezone }).from(schema.businesses).where(eq(schema.businesses.id, businessId));
  if (input.date < todayIn(biz.tz)) throw badRequest("That day has already passed");
  const [dup] = await db
    .select({ id: schema.slotWaitlist.id })
    .from(schema.slotWaitlist)
    .where(and(eq(schema.slotWaitlist.businessId, businessId), eq(schema.slotWaitlist.customerId, input.customerId), eq(schema.slotWaitlist.serviceId, input.serviceId), eq(schema.slotWaitlist.date, input.date), inArray(schema.slotWaitlist.status, ["waiting", "notified"])));
  if (dup) return dup.id;
  const id = newId("wl");
  await db.insert(schema.slotWaitlist).values({ id, businessId, customerId: input.customerId, serviceId: input.serviceId, staffId: input.staffId ?? null, date: input.date, source: input.source });
  return id;
}

export async function listWaitlist(business: schema.Business) {
  return db
    .select({ w: schema.slotWaitlist, customer: schema.customers.name, service: schema.services.name })
    .from(schema.slotWaitlist)
    .innerJoin(schema.customers, eq(schema.customers.id, schema.slotWaitlist.customerId))
    .innerJoin(schema.services, eq(schema.services.id, schema.slotWaitlist.serviceId))
    .where(and(eq(schema.slotWaitlist.businessId, business.id), gte(schema.slotWaitlist.date, todayIn(business.timezone)), inArray(schema.slotWaitlist.status, ["waiting", "notified"])))
    .orderBy(asc(schema.slotWaitlist.date), asc(schema.slotWaitlist.createdAt));
}

export async function removeFromWaitlist(businessId: string, id: string) {
  await db.update(schema.slotWaitlist).set({ status: "removed" }).where(and(eq(schema.slotWaitlist.id, id), eq(schema.slotWaitlist.businessId, businessId)));
}

/** A customer who books on a day they were waiting for leaves the list. */
export async function markWaitlistBooked(businessId: string, customerId: string, date: string) {
  await db
    .update(schema.slotWaitlist)
    .set({ status: "booked" })
    .where(and(eq(schema.slotWaitlist.businessId, businessId), eq(schema.slotWaitlist.customerId, customerId), eq(schema.slotWaitlist.date, date), inArray(schema.slotWaitlist.status, ["waiting", "notified"])));
}

/** Called after a cancellation / reschedule frees time on `date`. Best-effort; never throws. */
export async function notifyFreedSlot(business: schema.Business, date: string) {
  try {
    if (date < todayIn(business.timezone)) return;
    const waiting = await db
      .select({ w: schema.slotWaitlist, c: schema.customers, s: schema.services })
      .from(schema.slotWaitlist)
      .innerJoin(schema.customers, eq(schema.customers.id, schema.slotWaitlist.customerId))
      .innerJoin(schema.services, eq(schema.services.id, schema.slotWaitlist.serviceId))
      .where(and(eq(schema.slotWaitlist.businessId, business.id), eq(schema.slotWaitlist.date, date), eq(schema.slotWaitlist.status, "waiting")))
      .orderBy(asc(schema.slotWaitlist.createdAt))
      .limit(20);
    if (!waiting.length) return;
    const appUrl = (await getSettings())["general.appUrl"];
    const { messageCustomer } = await import("./conversations");
    const { emailCustomerAboutWaitlist } = await import("./email");
    let sent = 0;
    for (const { w, c, s } of waiting) {
      if (sent >= NOTIFY_AT_ONCE) break;
      const slots = await getSlots(business, { serviceId: w.serviceId, date, staffId: w.staffId });
      if (!slots.length) continue;
      const link = `${appUrl}/b/${business.slug}?service=${w.serviceId}&date=${date}`;
      const times = slots.slice(0, 4).map((x) => x.time).join(", ");
      const viaChat = await messageCustomer(business.id, c.id, `Good news from ${business.name}: a slot for ${s.name} opened up on ${date} (${times}). Book it here before someone else does: ${link}`).catch(() => false);
      const viaEmail = c.email ? await emailCustomerAboutWaitlist(business, c, s.name, date, times, link).catch(() => false) : false;
      if (viaChat || viaEmail) {
        sent++;
        await db.update(schema.slotWaitlist).set({ status: "notified", notifiedAt: new Date() }).where(eq(schema.slotWaitlist.id, w.id));
      }
    }
  } catch (e) {
    console.error("waitlist notify", business.id, date, e);
  }
}

export async function waitlistCount(business: schema.Business) {
  const rows = await db
    .select({ id: schema.slotWaitlist.id })
    .from(schema.slotWaitlist)
    .where(and(eq(schema.slotWaitlist.businessId, business.id), gte(schema.slotWaitlist.date, todayIn(business.timezone)), eq(schema.slotWaitlist.status, "waiting")));
  return rows.length;
}
