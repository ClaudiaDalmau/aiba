import "server-only";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { badRequest, conflict, notFound } from "./errors";
import { audit } from "./events";
import { newId } from "./ids";
import { zonedParts } from "./time";

/**
 * Invoices: correlative numbering per business, series and year (SERIES2026-0001), immutable once issued.
 * Only the status changes (issued → paid, or cancelled with a reason).
 */

export function fiscalComplete(f: schema.FiscalProfile) {
  return Boolean(f.legalName?.trim() && f.taxId?.trim() && f.address?.trim());
}

export function computeTotals(lines: schema.InvoiceLine[]) {
  let subtotal = 0;
  let tax = 0;
  for (const l of lines) {
    const base = Math.round(l.quantity * l.unitPriceCents);
    subtotal += base;
    tax += Math.round((base * l.taxRate) / 100);
  }
  return { subtotal, tax, total: subtotal + tax };
}

async function nextNumber(businessId: string, series: string, year: number) {
  const [r] = await db
    .insert(schema.invoiceCounters)
    .values({ businessId, series, year, seq: 1 })
    .onConflictDoUpdate({
      target: [schema.invoiceCounters.businessId, schema.invoiceCounters.series, schema.invoiceCounters.year],
      set: { seq: sql`${schema.invoiceCounters.seq} + 1` },
    })
    .returning({ seq: schema.invoiceCounters.seq });
  return { seq: r.seq, number: `${series}${year}-${String(r.seq).padStart(4, "0")}` };
}

export type IssueInput = {
  buyer: schema.InvoiceParty;
  lines: schema.InvoiceLine[];
  customerId?: string | null;
  bookingId?: string | null;
  customerPackId?: string | null;
  notes?: string;
  paid?: boolean;
  paymentMethod?: string;
};

export async function issueInvoice(business: schema.Business, input: IssueInput, userId: string) {
  const f = business.fiscal ?? {};
  if (!fiscalComplete(f)) throw badRequest("Fill in your invoicing details (legal name, tax ID and address) first.");
  if (!input.buyer.name?.trim()) throw badRequest("Who is the invoice for? Add the customer's name.");
  const lines = input.lines
    .map((l) => ({ description: l.description.trim().slice(0, 300), quantity: Number(l.quantity) || 0, unitPriceCents: Math.round(Number(l.unitPriceCents) || 0), taxRate: Math.max(0, Math.min(100, Number(l.taxRate) || 0)) }))
    .filter((l) => l.description && l.quantity > 0);
  if (!lines.length) throw badRequest("Add at least one line with a description and quantity.");
  const totals = computeTotals(lines);
  if (totals.total <= 0) throw badRequest("The invoice total must be greater than zero.");
  if (input.bookingId) {
    const [dup] = await db.select({ n: schema.invoices.number }).from(schema.invoices).where(and(eq(schema.invoices.businessId, business.id), eq(schema.invoices.bookingId, input.bookingId), sql`${schema.invoices.status} <> 'cancelled'`));
    if (dup) throw conflict("already_invoiced", "This booking already has an invoice. Cancel it first to issue a new one.");
  }
  const series = (f.series || "F").replace(/[^A-Za-z0-9-]/g, "").slice(0, 8) || "F";
  const now = new Date();
  const year = Number(zonedParts(now, business.timezone).date.slice(0, 4));
  const { seq, number } = await nextNumber(business.id, series, year);
  const id = newId("inv");
  const issuer: schema.InvoiceParty = {
    name: f.legalName!.trim(),
    taxId: f.taxId!.trim(),
    address: [f.address, [f.postalCode, f.city].filter(Boolean).join(" "), f.country].filter((x) => x && x.trim()).join(", "),
    email: business.email || undefined,
  };
  await db.insert(schema.invoices).values({
    id,
    businessId: business.id,
    number,
    series,
    year,
    seq,
    issuedAt: now,
    customerId: input.customerId ?? null,
    bookingId: input.bookingId ?? null,
    customerPackId: input.customerPackId ?? null,
    issuer,
    buyer: { name: input.buyer.name.trim(), taxId: input.buyer.taxId?.trim() || undefined, address: input.buyer.address?.trim() || undefined, email: input.buyer.email?.trim() || undefined },
    lines,
    subtotalCents: totals.subtotal,
    taxCents: totals.tax,
    totalCents: totals.total,
    currency: business.currency,
    status: input.paid ? "paid" : "issued",
    paidAt: input.paid ? now : null,
    paymentMethod: input.paid ? (input.paymentMethod ?? "").slice(0, 40) : "",
    notes: (input.notes ?? "").slice(0, 1000),
    createdBy: userId,
  });
  await audit(business.id, { type: "user", id: userId }, "invoice.issued", id, { number, total: totals.total });
  return { id, number };
}

export async function getInvoice(businessId: string, id: string) {
  const [inv] = await db.select().from(schema.invoices).where(and(eq(schema.invoices.id, id), eq(schema.invoices.businessId, businessId)));
  if (!inv) throw notFound("Invoice");
  return inv;
}

export async function markInvoicePaid(businessId: string, id: string, method: string, userId: string) {
  const inv = await getInvoice(businessId, id);
  if (inv.status !== "issued") throw badRequest("Only pending invoices can be marked as paid.");
  await db.update(schema.invoices).set({ status: "paid", paidAt: new Date(), paymentMethod: method.slice(0, 40) }).where(eq(schema.invoices.id, id));
  await audit(businessId, { type: "user", id: userId }, "invoice.paid", id);
}

export async function cancelInvoice(businessId: string, id: string, reason: string, userId: string) {
  const inv = await getInvoice(businessId, id);
  if (inv.status === "cancelled") return;
  await db.update(schema.invoices).set({ status: "cancelled", cancelledAt: new Date(), cancelReason: reason.slice(0, 300) }).where(eq(schema.invoices.id, id));
  await audit(businessId, { type: "user", id: userId }, "invoice.cancelled", id, { reason });
}

export async function listInvoices(businessId: string, opts: { from?: Date; to?: Date; limit?: number } = {}) {
  return db
    .select()
    .from(schema.invoices)
    .where(and(eq(schema.invoices.businessId, businessId), opts.from ? gte(schema.invoices.issuedAt, opts.from) : undefined, opts.to ? lt(schema.invoices.issuedAt, opts.to) : undefined))
    .orderBy(desc(schema.invoices.issuedAt))
    .limit(opts.limit ?? 1000);
}

/** Calendar quarters of a year with base, tax and total of non-cancelled invoices, plus what is still unpaid. */
export async function quarterSummary(businessId: string, year: number, tz: string) {
  const rows = await listInvoices(businessId, { from: new Date(Date.UTC(year, 0, 1) - 14 * 3600_000), to: new Date(Date.UTC(year + 1, 0, 1) + 14 * 3600_000) });
  const qs = [1, 2, 3, 4].map((q) => ({ q, count: 0, base: 0, tax: 0, total: 0, unpaid: 0 }));
  for (const r of rows) {
    if (r.year !== year || r.status === "cancelled") continue;
    const q = qs[Math.floor((Number(zonedParts(r.issuedAt, tz).date.slice(5, 7)) - 1) / 3)];
    q.count++;
    q.base += r.subtotalCents;
    q.tax += r.taxCents;
    q.total += r.totalCents;
    if (r.status === "issued") q.unpaid += r.totalCents;
  }
  return qs;
}

/** Suggested invoice from a booking (or a sold pack). */
export async function draftFrom(business: schema.Business, opts: { bookingId?: string; packId?: string }) {
  const rate = business.fiscal?.taxRate ?? 0;
  const toNet = (gross: number) => Math.round(gross / (1 + rate / 100)); // prices are shown to customers with tax included
  if (opts.bookingId) {
    const [r] = await db
      .select({ b: schema.bookings, s: schema.services, c: schema.customers })
      .from(schema.bookings)
      .innerJoin(schema.services, eq(schema.services.id, schema.bookings.serviceId))
      .innerJoin(schema.customers, eq(schema.customers.id, schema.bookings.customerId))
      .where(and(eq(schema.bookings.id, opts.bookingId), eq(schema.bookings.businessId, business.id)));
    if (!r) return null;
    const date = zonedParts(r.b.startsAt, business.timezone).date;
    return {
      customerId: r.c.id,
      bookingId: r.b.id,
      buyer: { name: r.c.name, email: r.c.email ?? "" },
      lines: [{ description: `${r.s.name} (${date})`, quantity: 1, unitPriceCents: toNet(r.b.priceCents), taxRate: rate }],
    };
  }
  if (opts.packId) {
    const [r] = await db
      .select({ p: schema.customerPacks, c: schema.customers })
      .from(schema.customerPacks)
      .innerJoin(schema.customers, eq(schema.customers.id, schema.customerPacks.customerId))
      .where(and(eq(schema.customerPacks.id, opts.packId), eq(schema.customerPacks.businessId, business.id)));
    if (!r) return null;
    return {
      customerId: r.c.id,
      customerPackId: r.p.id,
      buyer: { name: r.c.name, email: r.c.email ?? "" },
      lines: [{ description: `${r.p.name} (${r.p.sessionsTotal})`, quantity: 1, unitPriceCents: toNet(r.p.priceCents), taxRate: rate }],
    };
  }
  return null;
}
