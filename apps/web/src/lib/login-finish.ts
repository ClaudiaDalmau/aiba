import "server-only";
import { cookies } from "next/headers";
import { createSession, SESSION_COOKIE } from "./auth";
import { isPlatformRole } from "./platform-rbac";
import { clearPending } from "./two-step";
import type { schema } from "@/db";

export const safeNext = (next: unknown) => (typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : null);

/** Create the web session once every required step passed; returns where to go. */
export async function finishLogin(user: Pick<schema.User, "id" | "platformRole" | "email" | "name">, next: string | null) {
  const { token, expiresAt, id } = await createSession(user.id, "web");
  const { headers } = await import("next/headers");
  const { noteSignIn } = await import("./devices");
  await noteSignIn(user, (await headers()).get("user-agent") ?? "", id);
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt });
  await clearPending();
  return safeNext(next) ?? (isPlatformRole(user.platformRole) ? "/admin" : "/app");
}
