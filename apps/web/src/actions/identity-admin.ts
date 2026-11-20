"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { requirePlatform } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { decideCheck } from "@/lib/identity";

export async function decideIdentity(f: FormData) {
  const admin = await requirePlatform("users.manage");
  const approve = f.get("decision") === "approve";
  const reason = String(f.get("reason") ?? "").trim();
  const userId = await decideCheck(admin.id, String(f.get("id")), approve, reason);
  const [u] = await db.select({ email: schema.users.email, name: schema.users.name }).from(schema.users).where(eq(schema.users.id, userId));
  if (u)
    await sendEmail({
      to: u.email,
      subject: approve ? "AIBA · Identity verified" : "AIBA · We couldn't verify your identity",
      html: approve ? `<p>Hi ${u.name.split(" ")[0]}, your identity is verified and your profile is live. Your photos have been deleted.</p>` : `<p>Hi ${u.name.split(" ")[0]}, we couldn't verify your photos${reason ? `: ${reason.replace(/[<>&]/g, "")}` : ""}. Please send them again from AIBA → Verify your identity. Your photos have been deleted.</p>`,
      text: approve ? "Your identity is verified and your profile is live." : `We couldn't verify your photos${reason ? `: ${reason}` : ""}. Please try again.`,
    }).catch(() => false);
  revalidatePath("/admin/verifications");
}
