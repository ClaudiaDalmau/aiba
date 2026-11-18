// Generic backend proxy: /api/backend/<path> → FastAPI /api/<path>
// Auto-forwards the JWT from the httpOnly cookie as a Bearer header.
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BACKEND_URL, SESSION_COOKIE } from "@/lib/backend";

async function forward(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const search = req.nextUrl.search || "";
  const url = `${BACKEND_URL}/api/${(path || []).join("/")}${search}`;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  const headers: Record<string, string> = { Accept: "application/json" };
  const ctype = req.headers.get("content-type");
  if (ctype) headers["Content-Type"] = ctype;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.text();
  }

  const res = await fetch(url, { method: req.method, headers, body, cache: "no-store" });

  // Forward binary/streamed responses (CSV, ZIP, PDF, images, etc.) as raw
  // bytes so downloads keep their bit-perfect content and headers.
  const responseHeaders = new Headers();
  const passthrough = [
    "content-type",
    "content-disposition",
    "content-length",
    "cache-control",
    "etag",
    "last-modified",
  ];
  for (const h of passthrough) {
    const v = res.headers.get(h);
    if (v) responseHeaders.set(h, v);
  }
  if (!responseHeaders.has("content-type")) {
    responseHeaders.set("content-type", "application/json");
  }
  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    status: res.status,
    headers: responseHeaders,
  });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;
