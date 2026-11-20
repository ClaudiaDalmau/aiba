"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/actions/workspace";
import { getT } from "@/i18n/server";
import { disconnect, updateConnection } from "@/lib/google-calendar";
import { tenantFor } from "@/lib/tenant";

export async function saveCalendarAction(_prev: ActionState, f: FormData): Promise<ActionState> {
  const t = await tenantFor("business.manage");
  const tr = await getT();
  await updateConnection(t.business.id, {
    pushBookings: f.get("pushBookings") === "on",
    blockBusy: f.get("blockBusy") === "on",
    staffId: String(f.get("staffId") ?? "") || null,
  });
  revalidatePath("/app/settings");
  return { ok: true, message: tr("Calendar settings saved") };
}

export async function disconnectCalendarAction() {
  const t = await tenantFor("business.manage");
  await disconnect(t.business.id, t.user.id);
  revalidatePath("/app/settings");
}
