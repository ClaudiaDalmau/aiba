import { publicRoute } from "@/lib/api";
import { createLead } from "@/lib/leads";
import { rateLimit } from "@/lib/rate-limit";

/** Website forms (waitlist, business types, Sensible access requests) post here through apps/site. */
export const POST = publicRoute(async (req) => {
  rateLimit(req, "leads", 8, 60_000);
  const { lead, total, isNew } = await createLead(await req.json());
  return { ok: true, id: lead.id, total, new: isNew };
});
