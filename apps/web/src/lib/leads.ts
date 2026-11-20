import "server-only";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { emailApplicantWaitlisted, emailTeamNewLead, emailTeamReviewMatch } from "./email";
import { newId } from "./ids";
import { describeMatches, matchReviewList, parseReviewList } from "./review-list";
import { getSettings } from "./settings";

const url = z.string().trim().max(300);

export const LeadInput = z.object({
  kind: z.enum(["waitlist", "access_request"]),
  email: z.email().max(200),
  name: z.string().trim().max(120).default(""),
  businessName: z.string().trim().max(160).default(""),
  category: z.string().trim().max(80).default(""),
  phone: z.string().trim().max(40).default(""),
  website: url.default(""),
  links: z.array(url).max(10).default([]),
  message: z.string().trim().max(2000).default(""),
  locale: z.string().trim().max(10).default(""),
  source: z.string().trim().max(120).default(""),
  /** Honeypot: real people leave it empty. */
  company_url: z.string().max(0).optional(),
});

/** Store (or refresh) a lead from the public website and alert the team. Same email + kind = one row. */
export async function createLead(raw: unknown) {
  const { company_url: _hp, ...input } = LeadInput.parse(raw);
  const email = input.email.toLowerCase();
  const [existing] = await db.select().from(schema.leads).where(and(eq(schema.leads.kind, input.kind), eq(schema.leads.email, email)));
  let lead: schema.Lead;
  if (existing) {
    [lead] = await db
      .update(schema.leads)
      .set({ ...input, email, links: input.links.length ? input.links : existing.links, message: input.message || existing.message })
      .where(eq(schema.leads.id, existing.id))
      .returning();
  } else {
    [lead] = await db.insert(schema.leads).values({ id: newId("lead"), ...input, email }).returning();
  }
  const matched = input.kind === "access_request" ? await reviewMatch(lead) : "";
  if (matched) {
    // On the manual review list: waitlist reply to the person, alert to the team, approval stays manual.
    const flag = `⚠ Manual review: ${matched}`;
    const newlyFlagged = !lead.notes.includes("⚠ Manual review");
    if (newlyFlagged) {
      [lead] = await db.update(schema.leads).set({ notes: lead.notes ? `${flag}\n${lead.notes}` : flag }).where(eq(schema.leads.id, lead.id)).returning();
    }
    if ((!existing || newlyFlagged) && lead.status !== "approved" && lead.status !== "rejected") {
      await emailApplicantWaitlisted(lead.email, lead.name, lead.locale).catch(() => false);
      await emailTeamReviewMatch({ what: "Access request", name: lead.name, email: lead.email, phone: lead.phone, matched, href: "/admin/leads?kind=access_request" }).catch(() => false);
    }
  } else if (!existing) {
    await emailTeamNewLead(lead).catch(() => false);
  }
  const [{ n }] = await db.select({ n: count() }).from(schema.leads).where(eq(schema.leads.kind, input.kind));
  return { lead, total: Number(n), isNew: !existing };
}

/** Which manual-review entries a lead matches («» = none). */
export async function reviewMatch(lead: Pick<schema.Lead, "email" | "name" | "businessName" | "phone" | "website" | "links" | "message">) {
  const list = parseReviewList(String((await getSettings())["sensitive.reviewList"] ?? ""));
  return describeMatches(matchReviewList(list, lead));
}

export async function leadStats() {
  const [{ n }] = await db.select({ n: count() }).from(schema.leads).where(eq(schema.leads.kind, "waitlist"));
  return { total: Number(n) };
}

export async function listLeads(opts: { kind?: string; status?: string; q?: string } = {}) {
  const where = [
    opts.kind === "waitlist" || opts.kind === "access_request" ? eq(schema.leads.kind, opts.kind) : undefined,
    opts.status && ["new", "contacted", "approved", "rejected"].includes(opts.status) ? eq(schema.leads.status, opts.status as schema.Lead["status"]) : undefined,
    opts.q ? sql`(${schema.leads.email} ilike ${"%" + opts.q + "%"} or ${schema.leads.name} ilike ${"%" + opts.q + "%"} or ${schema.leads.businessName} ilike ${"%" + opts.q + "%"})` : undefined,
  ].filter(Boolean);
  return db.select().from(schema.leads).where(where.length ? and(...where) : undefined).orderBy(desc(schema.leads.createdAt)).limit(500);
}
