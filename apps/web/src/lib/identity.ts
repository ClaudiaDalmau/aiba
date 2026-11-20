import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { encryptJson } from "./crypto";
import { badRequest, conflict } from "./errors";
import { audit } from "./events";
import { newId } from "./ids";

/**
 * Sensible: identity check before a profile goes live. The person uploads a photo of her ID document and a
 * selfie holding it; a platform admin compares them. Images are encrypted at rest and deleted as soon as
 * the decision is taken — only the outcome is kept. Built so a KYC provider (liveness check) can replace the
 * manual review later without changing the rest of the app.
 */

export const DOC_TYPES = ["id_card", "passport", "residence_permit", "driving_licence"] as const;
const MAX = 1_900_000; // per image after client-side compression (data URL length)

function checkImage(dataUrl: string) {
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(dataUrl)) throw badRequest("Upload a photo (JPG, PNG or WebP).");
  if (dataUrl.length > MAX) throw badRequest("The photo is too large. Try again.");
}

export async function latestCheck(userId: string) {
  const [c] = await db.select({ id: schema.identityChecks.id, status: schema.identityChecks.status, reason: schema.identityChecks.reason, createdAt: schema.identityChecks.createdAt }).from(schema.identityChecks).where(eq(schema.identityChecks.userId, userId)).orderBy(desc(schema.identityChecks.createdAt)).limit(1);
  return c ?? null;
}

export async function submitCheck(userId: string, input: { documentType: string; document: string; selfie: string }) {
  if (!(DOC_TYPES as readonly string[]).includes(input.documentType)) throw badRequest("Choose the document type.");
  checkImage(input.document);
  checkImage(input.selfie);
  const prev = await latestCheck(userId);
  if (prev?.status === "pending") throw conflict("pending", "Your documents are already being reviewed.");
  if (prev?.status === "approved") throw conflict("approved", "Your identity is already verified.");
  const id = newId("idc");
  await db.insert(schema.identityChecks).values({ id, userId, documentType: input.documentType, documentImage: encryptJson(input.document), selfieImage: encryptJson(input.selfie) });
  await audit(null, { type: "user", id: userId }, "identity.submitted", id);
  return id;
}

export async function decideCheck(adminId: string, checkId: string, approve: boolean, reason: string) {
  const [c] = await db.select().from(schema.identityChecks).where(and(eq(schema.identityChecks.id, checkId), eq(schema.identityChecks.status, "pending")));
  if (!c) throw badRequest("This check was already decided.");
  await db
    .update(schema.identityChecks)
    .set({ status: approve ? "approved" : "rejected", reason: reason.slice(0, 300), reviewedBy: adminId, reviewedAt: new Date(), documentImage: null, selfieImage: null })
    .where(eq(schema.identityChecks.id, checkId));
  if (approve) {
    await db.update(schema.users).set({ identityVerifiedAt: new Date(), requirePasskey: true }).where(eq(schema.users.id, c.userId));
    // Her Sensible profiles go live (by direct link only).
    const owned = await db
      .select({ id: schema.businesses.id })
      .from(schema.memberships)
      .innerJoin(schema.businesses, eq(schema.businesses.id, schema.memberships.businessId))
      .where(and(eq(schema.memberships.userId, c.userId), eq(schema.memberships.role, "owner"), eq(schema.businesses.platform, "sensitive")));
    for (const b of owned) await db.update(schema.businesses).set({ published: true }).where(eq(schema.businesses.id, b.id));
  }
  await audit(null, { type: "user", id: adminId }, approve ? "identity.approved" : "identity.rejected", c.userId, { check: checkId, reason });
  return c.userId;
}
