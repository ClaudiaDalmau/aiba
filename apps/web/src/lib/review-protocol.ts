import "server-only";
import { and, eq, gt, isNotNull, isNull, lte } from "drizzle-orm";
import { db, schema } from "@/db";
import { emailReviewPeriodEnding, emailReviewPeriodStarted } from "./email";
import { audit } from "./events";
import { getSettings } from "./settings";

/**
 * Sensible manual-review protocol. A person on the review list can use the Sensible platform, but for
 * a set period (12 months by default, counted from sign-up) the private community is titles-only:
 * they see category and topic titles, never the content, and cannot post, reply or react.
 *
 * The person is told why, until when and how to appeal (DSA art. 17: no silent restrictions).
 * The platform team is warned some days before the period ends; it then ends on its own unless an
 * admin extends it from Admin → Users.
 */

export function addMonths(d: Date, months: number) {
  const out = new Date(d);
  out.setUTCMonth(out.getUTCMonth() + months);
  return out;
}

/** Start (or keep) the review period for this person. Never shortens one already running. */
export async function startReviewPeriod(userId: string, matched: string, opts: { locale?: string; from?: Date } = {}) {
  const s = await getSettings();
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!u) return null;
  const from = opts.from ?? new Date();
  const until = addMonths(from, Number(s["sensitive.reviewMonths"]) || 12);
  if (u.communityReadOnlyUntil && u.communityReadOnlyUntil >= until) return u.communityReadOnlyUntil;
  const reason = u.communityReadOnlyReason || String(s["sensitive.reviewReason"] ?? "");
  await db
    .update(schema.users)
    .set({ communityReadOnlyUntil: until, communityReadOnlyReason: reason, communityReadOnlyNoticeAt: null })
    .where(eq(schema.users.id, userId));
  await audit(null, { type: "system", id: "review-protocol" }, "sensitive.review_period_started", userId, { until: until.toISOString(), matched });
  await emailReviewPeriodStarted(u.email, u.name, opts.locale ?? "en", until, reason).catch(() => false);
  return until;
}

export type ReadOnlyState = { until: Date; reason: string } | null;

/** Whether this person sees the community in titles-only mode right now. Platform staff never do. */
export async function communityReadOnly(user: { id: string; platformRole: string | null }): Promise<ReadOnlyState> {
  if (user.platformRole) return null;
  const [u] = await db
    .select({ until: schema.users.communityReadOnlyUntil, reason: schema.users.communityReadOnlyReason })
    .from(schema.users)
    .where(eq(schema.users.id, user.id));
  return u?.until && u.until > new Date() ? { until: u.until, reason: u.reason } : null;
}

/** Daily: warn the team about review periods ending within the notice window (once per period). */
export async function notifyEndingReviewPeriods(now = new Date()) {
  const s = await getSettings();
  const horizon = new Date(now.getTime() + (Number(s["sensitive.reviewNoticeDays"]) || 14) * 86_400_000);
  const due = await db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, until: schema.users.communityReadOnlyUntil })
    .from(schema.users)
    .where(and(isNotNull(schema.users.communityReadOnlyUntil), gt(schema.users.communityReadOnlyUntil, now), lte(schema.users.communityReadOnlyUntil, horizon), isNull(schema.users.communityReadOnlyNoticeAt)));
  let sent = 0;
  for (const u of due) {
    await emailReviewPeriodEnding({ userId: u.id, name: u.name, email: u.email, until: u.until! }).catch(() => false);
    await db.update(schema.users).set({ communityReadOnlyNoticeAt: now }).where(eq(schema.users.id, u.id));
    await audit(null, { type: "system", id: "review-protocol" }, "sensitive.review_period_notice", u.id, { until: u.until!.toISOString() });
    sent++;
  }
  return { reviewNotices: sent };
}
