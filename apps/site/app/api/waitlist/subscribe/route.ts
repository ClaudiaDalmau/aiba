import { NextRequest, NextResponse } from "next/server";
import { appFetch } from "@/lib/aiba-app";

/** Waitlist forms (home + business types) → AIBA app leads. */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const { ok, status, data } = await appFetch("/api/v1/public/leads", {
    method: "POST",
    forwardFor: req.headers.get("x-forwarded-for"),
    json: {
      kind: "waitlist",
      email: String(b.email ?? ""),
      name: String(b.full_name ?? b.name ?? ""),
      businessName: String(b.business_name ?? ""),
      category: String(b.business_category ?? b.profession ?? ""),
      phone: String(b.phone ?? ""),
      website: String(b.website ?? ""),
      locale: String(b.locale ?? b.lang ?? ""),
      source: String(b.source ?? "website"),
      company_url: b.company_url,
    },
  });
  if (!ok) return NextResponse.json({ ok: false, detail: data?.detail ?? "Error" }, { status });
  return NextResponse.json({ ok: true, total: data.total, position: data.total, already_registered: data.new === false });
}
