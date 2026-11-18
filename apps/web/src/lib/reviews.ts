import "server-only";
import { and, avg, count, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { badRequest, conflict, notFound } from "./errors";
import { audit, notifyBusiness } from "./events";
import { newId } from "./ids";

/** A booking can be reviewed once it is completed, or once a confirmed appointment has ended. */
export function reviewable(b: Pick<schema.Booking, "status" | "endsAt">) {
  return b.status === "completed" || (b.status === "confirmed" && b.endsAt.getTime() < Date.now());
}

export async function reviewForBooking(bookingId: string) {
  const [r] = await db.select().from(schema.reviews).where(eq(schema.reviews.bookingId, bookingId));
  return r ?? null;
}

/** Written by the customer from their manage link. */
export async function submitReview(
  row: { booking: schema.Booking; business: schema.Business; customer: schema.Customer },
  input: { rating: number; comment?: string },
) {
  const { booking, business, customer } = row;
  if (!reviewable(booking)) throw badRequest("You can review your appointment once it has taken place");
  const rating = Math.round(input.rating);
  if (!(rating >= 1 && rating <= 5)) throw badRequest("Rating must be between 1 and 5");
  if (await reviewForBooking(booking.id)) throw conflict("already_reviewed", "You have already reviewed this appointment");
  const first = customer.name.trim().split(/\s+/);
  const author = first.length > 1 ? `${first[0]} ${first[first.length - 1][0]}.` : first[0] || "";
  const [review] = await db
    .insert(schema.reviews)
    .values({
      id: newId("rev"),
      businessId: business.id,
      bookingId: booking.id,
      customerId: customer.id,
      staffId: booking.staffId,
      serviceId: booking.serviceId,
      authorName: author,
      rating,
      comment: (input.comment ?? "").trim().slice(0, 1500),
    })
    .returning();
  await audit(business.id, { type: "customer", id: customer.id }, "review.created", review.id, { rating });
  await notifyBusiness(business.id, {
    kind: "review.created",
    title: `${"★".repeat(rating)}${"☆".repeat(5 - rating)} ${author}`,
    body: review.comment.slice(0, 140),
    href: "/app/reviews",
  });
  return review;
}

export async function businessRating(businessId: string) {
  const [r] = await db
    .select({ n: count(), avg: avg(schema.reviews.rating) })
    .from(schema.reviews)
    .where(and(eq(schema.reviews.businessId, businessId), eq(schema.reviews.hidden, false)));
  const n = Number(r?.n ?? 0);
  return { count: n, average: n ? Math.round(Number(r?.avg ?? 0) * 10) / 10 : null };
}

export async function publicReviews(businessId: string, limit = 6) {
  return db
    .select({ review: schema.reviews, service: schema.services.name, staff: schema.staff.name })
    .from(schema.reviews)
    .leftJoin(schema.services, eq(schema.services.id, schema.reviews.serviceId))
    .leftJoin(schema.staff, eq(schema.staff.id, schema.reviews.staffId))
    .where(and(eq(schema.reviews.businessId, businessId), eq(schema.reviews.hidden, false)))
    .orderBy(desc(schema.reviews.createdAt))
    .limit(limit);
}

export async function listReviews(businessId: string) {
  return db
    .select({ review: schema.reviews, service: schema.services.name, staff: schema.staff.name, customer: schema.customers.name })
    .from(schema.reviews)
    .leftJoin(schema.services, eq(schema.services.id, schema.reviews.serviceId))
    .leftJoin(schema.staff, eq(schema.staff.id, schema.reviews.staffId))
    .leftJoin(schema.customers, eq(schema.customers.id, schema.reviews.customerId))
    .where(eq(schema.reviews.businessId, businessId))
    .orderBy(desc(schema.reviews.createdAt))
    .limit(500);
}

export async function updateReview(businessId: string, id: string, patch: { reply?: string; hidden?: boolean }, userId: string) {
  const set: Partial<schema.Review> = {};
  if (patch.reply !== undefined) {
    set.reply = patch.reply.trim().slice(0, 1500);
    set.repliedAt = set.reply ? new Date() : null;
  }
  if (patch.hidden !== undefined) set.hidden = patch.hidden;
  const [r] = await db.update(schema.reviews).set(set).where(and(eq(schema.reviews.id, id), eq(schema.reviews.businessId, businessId))).returning();
  if (!r) throw notFound("Review");
  await audit(businessId, { type: "user", id: userId }, "review.updated", id, { hidden: r.hidden, replied: Boolean(r.reply) });
  return r;
}
