"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { getT } from "@/i18n/server";
import { requirePlatform, requireUser } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { newId } from "@/lib/ids";
import { getSettings } from "@/lib/settings";

export type SafetyState = { ok?: boolean; error?: string } | null;

/** Confidential request for help. Leaves no trace in the workspace (no audit log, no notification). */
export async function requestHelp(_p: SafetyState, f: FormData): Promise<SafetyState> {
  const u = await requireUser();
  const t = await getT();
  const message = String(f.get("message") ?? "").trim().slice(0, 3000);
  const contact = String(f.get("contact") ?? "").trim().slice(0, 300);
  const urgent = f.get("urgent") === "on";
  const businessId = (await cookies()).get("aiba_biz")?.value ?? null;
  await db.insert(schema.safetyAlerts).values({ id: newId("sfa"), userId: u.id, businessId, message, contact, urgent });
  const s = await getSettings();
  const inbox = String(s["email.teamInbox"] || s["general.supportEmail"] || "");
  if (inbox) {
    const txt = `${urgent ? "URGENT · " : ""}Confidential help request from ${u.email}. Safe contact: ${contact || "(not given — use only the in-app channel)"}. Open Admin → Safety alerts.`;
    await sendEmail({ to: inbox, subject: `${urgent ? "[URGENT] " : ""}AIBA · Confidential help request`, html: `<p>${txt.replace(/[<>&]/g, "")}</p>`, text: txt }).catch(() => false);
  }
  return { ok: true };
}

export async function updateSafetyAlert(f: FormData) {
  const admin = await requirePlatform("users.manage");
  await db
    .update(schema.safetyAlerts)
    .set({ status: String(f.get("status")) as "open" | "in_progress" | "closed", notes: String(f.get("notes") ?? "").slice(0, 4000), handledBy: admin.id })
    .where(eq(schema.safetyAlerts.id, String(f.get("id"))));
  revalidatePath("/admin/safety");
}
