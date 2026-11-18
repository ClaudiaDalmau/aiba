// Helpers to manage the JWT session cookie (server-side only).
import { cookies } from "next/headers";
import { SESSION_COOKIE, backendFetch } from "./backend";

export type SessionUser = {
  user_id: string;
  email: string;
  full_name?: string;
  business_name?: string;
  plan?: string;
  business_category?: string;
  is_sensitive_vertical?: boolean;
  is_admin?: boolean;
  /** Iter91 — effective RBAC role: "admin" | "moderator" | "user". */
  role?: "admin" | "moderator" | "user";
  onboarding_completed?: boolean;
};

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // 7 days — matches backend JWT lifetime (adjust if backend uses longer)
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function hasSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(SESSION_COOKIE)?.value);
}

/** Read the raw JWT from the session cookie (null if unauthenticated). */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value || null;
}

/** Fetch the currently authenticated user from the backend, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  if (!cookieStore.get(SESSION_COOKIE)?.value) return null;
  try {
    const u = await backendFetch<SessionUser>("/auth/me", { auth: true });
    return u;
  } catch {
    return null;
  }
}
