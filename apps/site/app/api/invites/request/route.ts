import { NextRequest, NextResponse } from "next/server";
import { appFetch } from "@/lib/aiba-app";

/** Sensible access requests ("Otros profesionales" card) → AIBA app leads. */
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const { ok, status, data } = await appFetch("/api/v1/public/leads", {
    method: "POST",
    forwardFor: req.headers.get("x-forwarded-for"),
    json: {
      kind: "access_request",
      email: String(b.email ?? ""),
      name: String(b.full_name ?? ""),
      category: String(b.activity ?? ""),
      phone: String(b.phone ?? ""),
      website: String(b.website ?? ""),
      links: Array.isArray(b.portal_links) ? b.portal_links.map(String).slice(0, 10) : [],
      message: String(b.message ?? ""),
      locale: String(b.locale ?? ""),
      source: String(b.referral ?? "website"),
    },
  });
  if (!ok) return NextResponse.json({ ok: false, detail: data?.detail ?? "Error" }, { status });
  return NextResponse.json({ ok: true, request_id: data.id });
}
