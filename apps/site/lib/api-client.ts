// Client-side API helper — always hits the Next.js proxy, which adds the JWT.
export type ApiOptions = { method?: string; body?: unknown; signal?: AbortSignal };

function formatDetail(status: number, data: unknown): string {
  if (!data || typeof data !== "object") return `HTTP ${status}`;
  const detail = (data as any).detail;
  if (typeof detail === "string" && detail.trim().length) return detail;
  if (Array.isArray(detail)) {
    const msgs = detail.map((d: any) => {
      if (typeof d === "string") return d;
      if (d && typeof d === "object") {
        const loc = Array.isArray(d.loc) ? d.loc.filter((x: any) => x !== "body").join(".") : "";
        const msg = d.msg || d.message || d.type || "invalid";
        return loc ? `${loc}: ${msg}` : msg;
      }
      return String(d);
    });
    return msgs.join(" · ") || `HTTP ${status}`;
  }
  if (detail && typeof detail === "object") {
    try { return JSON.stringify(detail); } catch { return `HTTP ${status}`; }
  }
  return `HTTP ${status}`;
}

export async function api<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`/api/backend${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    cache: "no-store",
  });

  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const err: any = new Error(formatDetail(res.status, data));
    err.status = res.status;
    throw err;
  }
  return data as T;
}
