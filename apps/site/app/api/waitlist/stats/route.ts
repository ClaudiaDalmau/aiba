import { NextResponse } from "next/server";
import { appFetch } from "@/lib/aiba-app";

export async function GET() {
  const { data } = await appFetch("/api/v1/public/leads/stats");
  return NextResponse.json({ total: Number(data?.total ?? 0) });
}
