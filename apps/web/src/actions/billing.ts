"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { startPlanChange } from "@/lib/billing";
import { getSetting } from "@/lib/settings";
import { tenantFor } from "@/lib/tenant";

export async function changePlan(form: FormData) {
  const t = await tenantFor("business.manage");
  const tier = String(form.get("tier") ?? "");
  if (tier === t.business.tier) return;
  // Sensible never goes through Stripe: plan changes are handled by the team until its own gateway is connected.
  if (t.business.platform === "sensitive") {
    const { audit } = await import("@/lib/events");
    await audit(t.business.id, { type: "user", id: t.user.id }, "sensitive.plan_change_requested", t.business.id, { tier });
  }
  if (t.business.platform === "sensitive") redirect(`/app/billing?sensitive=${encodeURIComponent(tier)}`);
  const h = await headers();
  const origin = (await getSetting("general.appUrl")) || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const { url } = await startPlanChange(t.business, tier, t.user.id, `${origin.replace(/\/$/, "")}/app/billing`);
  if (url) redirect(url);
  revalidatePath("/app", "layout");
}
