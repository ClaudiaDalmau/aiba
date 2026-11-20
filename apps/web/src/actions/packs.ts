"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/actions/workspace";
import { getT } from "@/i18n/server";
import { AppError } from "@/lib/errors";
import { deletePack, grantPack, savePack, voidCustomerPack } from "@/lib/packs";
import { tenantFor } from "@/lib/tenant";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) => Number(s(f, k).replace(",", "."));

async function run(fn: () => Promise<string>): Promise<ActionState> {
  const t = await getT();
  try {
    return { ok: true, message: t(await fn()) };
  } catch (e) {
    if (e instanceof AppError) return { error: t(e.message) };
    console.error(e);
    return { error: t("Something went wrong. Please try again.") };
  }
}

export async function savePackAction(_prev: ActionState, f: FormData): Promise<ActionState> {
  const t = await tenantFor("catalog.manage");
  return run(async () => {
    await savePack(
      t.business.id,
      {
        id: s(f, "id") || undefined,
        name: s(f, "name"),
        description: s(f, "description"),
        serviceId: s(f, "serviceId"),
        sessions: Math.round(num(f, "sessions")),
        priceCents: Math.round(num(f, "price") * 100),
        validityDays: Math.round(num(f, "validityDays") || 365),
        active: s(f, "id") ? f.get("active") === "on" : true,
      },
      t.user.id,
    );
    revalidatePath("/app/packs");
    return "Pack saved";
  });
}

export async function deletePackAction(f: FormData) {
  const t = await tenantFor("catalog.manage");
  await deletePack(t.business.id, s(f, "id"), t.user.id);
  revalidatePath("/app/packs");
}

export async function grantPackAction(_prev: ActionState, f: FormData): Promise<ActionState> {
  const t = await tenantFor("customers.manage");
  return run(async () => {
    const customerId = s(f, "customerId");
    await grantPack(t.business.id, customerId, s(f, "packId"), t.user.id);
    revalidatePath(`/app/customers/${customerId}`);
    revalidatePath("/app/packs");
    return "Pack added. Their next bookings of that service will use it automatically.";
  });
}

export async function voidPackAction(f: FormData) {
  const t = await tenantFor("customers.manage");
  await voidCustomerPack(t.business.id, s(f, "id"), t.user.id);
  revalidatePath(`/app/customers/${s(f, "customerId")}`);
  revalidatePath("/app/packs");
}
