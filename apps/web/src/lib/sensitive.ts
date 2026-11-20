import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { decryptJson, encryptJson } from "./crypto";
import { getSettings } from "./settings";

/** Sensible platform rules shared by onboarding, settings and the agent. */

export const isSensitive = (b: Pick<schema.Business, "platform">) => b.platform === "sensitive";

export async function allowedCountries() {
  const raw = String((await getSettings())["sensitive.allowedCountries"] ?? "");
  return raw.split(/[,\s]+/).map((c) => c.trim().toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c));
}

/** Sensible profiles owned by one verified person, and how many their best plan allows. */
export async function profileAllowance(userId: string) {
  const s = await getSettings();
  const rows = await db
    .select({ tier: schema.businesses.tier })
    .from(schema.memberships)
    .innerJoin(schema.businesses, eq(schema.businesses.id, schema.memberships.businessId))
    .where(and(eq(schema.memberships.userId, userId), eq(schema.memberships.role, "owner"), eq(schema.businesses.platform, "sensitive")));
  const limitFor = (tier: string) => (tier === "premium" ? Number(s["sensitive.profilesPremium"]) : tier === "vip" ? Number(s["sensitive.profilesPro"]) : Number(s["sensitive.profilesBasic"]));
  const limit = rows.length ? Math.max(...rows.map((r) => limitFor(r.tier))) : limitFor("standard");
  return { used: rows.length, limit };
}

export type PrivateProfile = { services?: string; rates?: string; boundaries?: string; notes?: string };
export const readPrivateProfile = (b: Pick<schema.Business, "privateProfile">): PrivateProfile => {
  if (!b.privateProfile) return {};
  try {
    return decryptJson<PrivateProfile>(b.privateProfile);
  } catch {
    return {};
  }
};
export const sealPrivateProfile = (p: PrivateProfile) => encryptJson(p);

/** Travel stops that are current or upcoming (YYYY-MM-DD compare). */
export function upcomingTravel(b: Pick<schema.Business, "travel">, today: string) {
  return (b.travel ?? []).filter((s) => s.to >= today).sort((a, z) => a.from.localeCompare(z.from));
}
