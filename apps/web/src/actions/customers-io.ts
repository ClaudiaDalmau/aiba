"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/actions/workspace";
import { getT } from "@/i18n/server";
import { importCustomers } from "@/lib/customers-io";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/events";
import { tenantFor } from "@/lib/tenant";

export async function importCustomersAction(_prev: ActionState, f: FormData): Promise<ActionState> {
  const t = await tenantFor("customers.manage");
  const tr = await getT();
  try {
    const file = f.get("file");
    if (!(file instanceof File) || !file.size) throw new AppError(400, "bad_request", "Choose a CSV file");
    if (file.size > 3 * 1024 * 1024) throw new AppError(400, "too_large", "Max 3 MB per file");
    const r = await importCustomers(t.business.id, await file.text());
    await audit(t.business.id, { type: "user", id: t.user.id }, "customers.imported", t.business.id, r);
    revalidatePath("/app/customers");
    return { ok: true, message: tr("{created} new, {updated} already existed, {skipped} skipped (no name or contact).", { created: r.created, updated: r.updated, skipped: r.skipped }) };
  } catch (e) {
    if (e instanceof AppError) return { error: tr(e.message) };
    console.error(e);
    return { error: tr("Something went wrong. Please try again.") };
  }
}
