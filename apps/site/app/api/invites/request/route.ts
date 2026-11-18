import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await backendFetch<{ ok: boolean; request_id: string }>(
      "/invites/request",
      { method: "POST", json: body },
    );
    return NextResponse.json(data);
  } catch (e: any) {
    const status = e?.status || 500;
    const detail = e?.body?.detail || e?.message || "Error";
    return NextResponse.json({ ok: false, detail }, { status });
  }
}
