import { z } from "zod";
import { body, publicRoute } from "@/lib/api";
import { findOrCreateCustomer } from "@/lib/bookings";
import { rateLimit } from "@/lib/rate-limit";
import { businessForRequest } from "@/lib/public";
import { joinWaitlist } from "@/lib/waitlist";

const Body = z.object({
  serviceId: z.string(),
  staffId: z.string().nullish(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().trim().min(1).max(80),
  email: z.email().max(200),
  phone: z.string().trim().max(40).optional(),
  consent: z.literal(true, { message: "Please accept the privacy notice" }),
});

/** «Let me know if a slot frees up» on a full day. */
export const POST = publicRoute(async (req, p) => {
  rateLimit(req, "public-waitlist", 6, 60_000);
  const input = await body(req, Body);
  const business = await businessForRequest(req, p.slug);
  const customer = await findOrCreateCustomer(business.id, { name: input.name, email: input.email, phone: input.phone });
  await joinWaitlist(business.id, { customerId: customer.id, serviceId: input.serviceId, staffId: input.staffId || null, date: input.date, source: "web" });
  return Response.json({ ok: true }, { status: 201 });
});
