"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/i18n/server";
import { bookingByToken, markNoAgreement } from "@/lib/bookings";
import { AppError } from "@/lib/errors";

import type { ActionState } from "./workspace";

/** The customer closes the appointment at the door with «no agreement» (no consequences for either side). */
export async function customerNoAgreement(_prev: ActionState, f: FormData): Promise<ActionState> {
  const t = await getT();
  const token = String(f.get("token") ?? "");
  try {
    const row = await bookingByToken(token);
    if (!row) return { error: t("Booking not found") };
    await markNoAgreement(row.business, row.booking.id, "customer", String(f.get("reason") ?? ""), { type: "customer", id: row.customer.id });
  } catch (e) {
    if (e instanceof AppError) return { error: t(e.message) };
    throw e;
  }
  revalidatePath(`/manage/${token}`);
  return { ok: true, message: t("Closed without agreement. Nothing is charged as a no-show.") };
}
