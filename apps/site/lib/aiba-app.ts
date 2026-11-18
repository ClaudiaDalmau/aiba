// Server-side helper: the public website forwards form submissions to the AIBA app API.
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://aiba-pied.vercel.app").replace(/\/$/, "");

export async function appFetch(path: string, init: RequestInit & { json?: unknown; forwardFor?: string | null } = {}) {
  const { json, forwardFor, headers, ...rest } = init;
  const res = await fetch(`${APP_URL}${path}`, {
    ...rest,
    cache: "no-store",
    headers: {
      accept: "application/json",
      ...(json !== undefined ? { "content-type": "application/json" } : {}),
      ...(forwardFor ? { "x-forwarded-for": forwardFor } : {}),
      ...(headers as Record<string, string> | undefined),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
