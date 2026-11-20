import "server-only";
import { cookies } from "next/headers";
import { createSession, SESSION_COOKIE } from "./auth";
import { isPlatformRole } from "./platform-rbac";
import { clearPending } from "./two-step";
import type { schema } from "@/db";

export const safeNext = (next: unknown) => (typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : null);

/** Create the web session once every required step passed; returns where to go. */
export async function finishLogin(user: Pick<schema.User, "id" | "platformRole" | "email" | "name"> & { requirePasskey?: boolean }, next: string | null) {
  const { headers } = await import("next/headers");
  const { noteSignIn, isMobileUA } = await import("./devices");
  const ua = (await headers()).get("user-agent") ?? "";
  if (user.requirePasskey && !user.platformRole && !isMobileUA(ua)) {
    const { AppError } = await import("./errors");
    throw new AppError(403, "mobile_only", "For your safety, this account can only be used from your mobile phone.");
  }
  const { token, expiresAt, id } = await createSession(user.id, "web");
  await noteSignIn(user, ua, id);
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt });
  await clearPending();
  return safeNext(next) ?? (isPlatformRole(user.platformRole) ? "/admin" : "/app");
}
