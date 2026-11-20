import "server-only";
import { and, asc, desc, eq, gt, inArray, isNull, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { badRequest, notFound } from "./errors";
import { audit } from "./events";
import { newId } from "./ids";

/** «Bonos»: prepaid packs of N sessions of one service. A session is used by any non-cancelled booking linked to it. */

export async function listPacks(businessId: string, onlyActive = false) {
  return db
    .select({ pack: schema.packs, serviceName: schema.services.name, servicePriceCents: schema.services.priceCents })
    .from(schema.packs)
    .innerJoin(schema.services, eq(schema.services.id, schema.packs.serviceId))
    .where(and(eq(schema.packs.businessId, businessId), onlyActive ? eq(schema.packs.active, true) : undefined))
    .orderBy(desc(schema.packs.active), asc(schema.packs.name));
}

export type PackInput = { id?: string; name: string; description: string; serviceId: string; sessions: number; priceCents: number; validityDays: number; active: boolean };

export async function savePack(businessId: string, input: PackInput, userId: string) {
  const name = input.name.trim();
  if (name.length < 2) throw badRequest("Give the pack a name");
  if (!Number.isInteger(input.sessions) || input.sessions < 2 || input.sessions > 100) throw badRequest("A pack has between 2 and 100 sessions");
  if (!(input.priceCents > 0)) throw badRequest("Set the pack price");
  if (!Number.isInteger(input.validityDays) || input.validityDays < 7 || input.validityDays > 1095) throw badRequest("Validity must be between 7 and 1095 days");
  const [svc] = await db.select({ id: schema.services.id }).from(schema.services).where(and(eq(schema.services.id, input.serviceId), eq(schema.services.businessId, businessId)));
  if (!svc) throw notFound("Service");
  const values = { name, description: input.description.trim().slice(0, 500), serviceId: input.serviceId, sessions: input.sessions, priceCents: Math.round(input.priceCents), validityDays: input.validityDays, active: input.active };
  if (input.id) {
    const r = await db.update(schema.packs).set(values).where(and(eq(schema.packs.id, input.id), eq(schema.packs.businessId, businessId))).returning({ id: schema.packs.id });
    if (!r.length) throw notFound("Pack");
    await audit(businessId, { type: "user", id: userId }, "pack.updated", input.id);
    return input.id;
  }
  const id = newId("pck");
  await db.insert(schema.packs).values({ id, businessId, ...values });
  await audit(businessId, { type: "user", id: userId }, "pack.created", id);
  return id;
}

export async function deletePack(businessId: string, id: string, userId: string) {
  // Sold packs keep their own copy of name/sessions/price, so deleting the definition is safe.
  await db.delete(schema.packs).where(and(eq(schema.packs.id, id), eq(schema.packs.businessId, businessId)));
  await audit(businessId, { type: "user", id: userId }, "pack.deleted", id);
}

/** Sold packs with used/remaining sessions. */
export async function listCustomerPacks(businessId: string, opts: { customerId?: string; limit?: number } = {}) {
  const used = db
    .select({ cp: schema.bookings.customerPackId, n: sql<number>`count(*)::int`.as("n") })
    .from(schema.bookings)
    .where(and(eq(schema.bookings.businessId, businessId), ne(schema.bookings.status, "cancelled")))
    .groupBy(schema.bookings.customerPackId)
    .as("used");
  const rows = await db
    .select({ cp: schema.customerPacks, customerName: schema.customers.name, serviceName: schema.services.name, used: used.n })
    .from(schema.customerPacks)
    .innerJoin(schema.customers, eq(schema.customers.id, schema.customerPacks.customerId))
    .innerJoin(schema.services, eq(schema.services.id, schema.customerPacks.serviceId))
    .leftJoin(used, eq(used.cp, schema.customerPacks.id))
    .where(and(eq(schema.customerPacks.businessId, businessId), opts.customerId ? eq(schema.customerPacks.customerId, opts.customerId) : undefined))
    .orderBy(desc(schema.customerPacks.createdAt))
    .limit(opts.limit ?? 200);
  const now = Date.now();
  return rows.map((r) => {
    const usedN = r.used ?? 0;
    const remaining = Math.max(0, r.cp.sessionsTotal - usedN);
    const status: "active" | "used_up" | "expired" | "voided" = r.cp.voidedAt ? "voided" : remaining === 0 ? "used_up" : r.cp.expiresAt.getTime() < now ? "expired" : "active";
    return { ...r.cp, customerName: r.customerName, serviceName: r.serviceName, used: usedN, remaining, status };
  });
}

export async function grantPack(businessId: string, customerId: string, packId: string, userId: string) {
  const [pack] = await db.select().from(schema.packs).where(and(eq(schema.packs.id, packId), eq(schema.packs.businessId, businessId)));
  if (!pack) throw notFound("Pack");
  const [c] = await db.select({ id: schema.customers.id, erasedAt: schema.customers.erasedAt }).from(schema.customers).where(and(eq(schema.customers.id, customerId), eq(schema.customers.businessId, businessId)));
  if (!c || c.erasedAt) throw notFound("Customer");
  const id = newId("cpk");
  await db.insert(schema.customerPacks).values({
    id,
    businessId,
    customerId,
    packId: pack.id,
    serviceId: pack.serviceId,
    name: pack.name,
    sessionsTotal: pack.sessions,
    priceCents: pack.priceCents,
    payment: "offline",
    expiresAt: new Date(Date.now() + pack.validityDays * 86_400_000),
    createdBy: userId,
  });
  await audit(businessId, { type: "user", id: userId }, "pack.sold", id, { customerId, packId });
  return id;
}

export async function voidCustomerPack(businessId: string, id: string, userId: string) {
  await db.update(schema.customerPacks).set({ voidedAt: new Date() }).where(and(eq(schema.customerPacks.id, id), eq(schema.customerPacks.businessId, businessId)));
  await audit(businessId, { type: "user", id: userId }, "pack.voided", id);
}

/** The pack a new booking of this service should use (soonest to expire), or null. */
export async function usablePack(businessId: string, customerId: string, serviceId: string, at: Date) {
  const cands = await db
    .select()
    .from(schema.customerPacks)
    .where(
      and(
        eq(schema.customerPacks.businessId, businessId),
        eq(schema.customerPacks.customerId, customerId),
        eq(schema.customerPacks.serviceId, serviceId),
        isNull(schema.customerPacks.voidedAt),
        gt(schema.customerPacks.expiresAt, at),
      ),
    )
    .orderBy(asc(schema.customerPacks.expiresAt));
  if (!cands.length) return null;
  const counts = await db
    .select({ cp: schema.bookings.customerPackId, n: sql<number>`count(*)::int` })
    .from(schema.bookings)
    .where(and(inArray(schema.bookings.customerPackId, cands.map((c) => c.id)), ne(schema.bookings.status, "cancelled")))
    .groupBy(schema.bookings.customerPackId);
  return cands.find((c) => (counts.find((x) => x.cp === c.id)?.n ?? 0) < c.sessionsTotal) ?? null;
}
