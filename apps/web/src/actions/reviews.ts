"use server";

import { revalidatePath } from "next/cache";
import { updateReview } from "@/lib/reviews";
import { tenantFor } from "@/lib/tenant";

export async function replyReviewAction(f: FormData) {
  const t = await tenantFor("customers.manage");
  await updateReview(t.business.id, String(f.get("id") ?? ""), { reply: String(f.get("reply") ?? "") }, t.user.id);
  revalidatePath("/app/reviews");
}

export async function toggleReviewAction(f: FormData) {
  const t = await tenantFor("customers.manage");
  await updateReview(t.business.id, String(f.get("id") ?? ""), { hidden: f.get("hidden") === "true" }, t.user.id);
  revalidatePath("/app/reviews");
}
