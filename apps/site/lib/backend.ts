// Server-side helper for calling the FastAPI backend.
// Only use this inside Route Handlers or Server Components — never in a Client Component.
import { cookies } from "next/headers";

export const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "http://localhost:8001";
export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "aib_session";

export type BackendFetchOptions = RequestInit & {
  /** If true, forward the JWT from the httpOnly cookie as Bearer token */
  auth?: boolean;
  /** JSON body — will be stringified and Content-Type set */
  json?: unknown;
};

/**
 * Call the backend from a server context. Returns parsed JSON or throws.
 * The response includes a `.__status` non-enumerable property for status code inspection.
 */
export async function backendFetch<T = any>(path: string, opts: BackendFetchOptions = {}): Promise<T> {
  const { auth = false, json, headers, ...rest } = opts;
  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };
  if (json !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }
  if (auth) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }
  const url = path.startsWith("http") ? path : `${BACKEND_URL}/api${path}`;
  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: "no-store",
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const detail = (data && typeof data === "object" && data.detail) || text || `HTTP ${res.status}`;
    const err: any = new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data as T;
}

/**
 * Convenience wrapper that automatically forwards the session cookie
 * as an Authorization bearer to the backend. Prefer this over
 * `backendFetch({ auth: true })` for authenticated route handlers.
 */
export async function authedBackendFetch<T = any>(
  path: string,
  opts: Omit<BackendFetchOptions, "auth"> = {},
): Promise<T> {
  return backendFetch<T>(path, { ...opts, auth: true });
}
