import { z } from "zod";
import { body, userRoute } from "@/lib/api";
import { submitCheck } from "@/lib/identity";
import { rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { sendEmail } from "@/lib/email";

const Body = z.object({ documentType: z.string(), document: z.string(), selfie: z.string(), consent: z.literal(true) });

export const POST = userRoute(async (req, user) => {
  rateLimit(req, "identity", 5, 60_000);
  const input = await body(req, Body);
  await submitCheck(user.id, input);
  const s = await getSettings();
  const inbox = String(s["email.teamInbox"] || s["general.supportEmail"] || "");
  if (inbox) await sendEmail({ to: inbox, subject: "AIBA · New identity check to review", html: `<p>${user.email} sent their documents. Review them in Admin → Verifications.</p>`, text: `${user.email} sent their documents. Review them in Admin → Verifications.` }).catch(() => false);
  return Response.json({ ok: true }, { status: 201 });
});
