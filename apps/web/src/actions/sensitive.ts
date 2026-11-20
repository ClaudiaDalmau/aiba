"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/actions/workspace";
import { db, schema } from "@/db";
import { getT } from "@/i18n/server";
import { audit } from "@/lib/events";
import { sealPrivateProfile } from "@/lib/sensitive";
import { tenantFor } from "@/lib/tenant";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function savePrivateProfile(_p: ActionState, f: FormData): Promise<ActionState> {
  const t = await tenantFor("business.manage");
  const tr = await getT();
  if (t.business.platform !== "sensitive") return { error: tr("Only for Sensible profiles") };
  const sheet = { services: s(f, "services").slice(0, 4000), rates: s(f, "rates").slice(0, 2000), boundaries: s(f, "boundaries").slice(0, 2000), notes: s(f, "notes").slice(0, 4000) };
  await db.update(schema.businesses).set({ privateProfile: sealPrivateProfile(sheet) }).where(eq(schema.businesses.id, t.business.id));
  await audit(t.business.id, { type: "user", id: t.user.id }, "sensitive.private_sheet_saved", t.business.id);
  revalidatePath("/app/private");
  return { ok: true, message: tr("Saved. Only you can see it.") };
}

export async function addTravelStop(_p: ActionState, f: FormData): Promise<ActionState> {
  const t = await tenantFor("business.manage");
  const tr = await getT();
  const city = s(f, "city").slice(0, 80);
  const from = s(f, "from");
  const to = s(f, "to");
  if (!city || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || to < from) return { error: tr("Write the city and valid dates") };
  const travel = [...(t.business.travel ?? []), { city, from, to, note: s(f, "note").slice(0, 120) || undefined }].sort((a, b) => a.from.localeCompare(b.from)).slice(-30);
  await db.update(schema.businesses).set({ travel }).where(eq(schema.businesses.id, t.business.id));
  revalidatePath("/app/travel");
  return { ok: true, message: tr("Trip added. Your page and your assistant show it now.") };
}

export async function removeTravelStop(f: FormData) {
  const t = await tenantFor("business.manage");
  const i = Number(f.get("index"));
  const travel = (t.business.travel ?? []).filter((_, j) => j !== i);
  await db.update(schema.businesses).set({ travel }).where(eq(schema.businesses.id, t.business.id));
  revalidatePath("/app/travel");
}
