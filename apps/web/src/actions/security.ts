"use server";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { getT } from "@/i18n/server";
import { requireUser } from "@/lib/auth";
import { decryptJson, encryptJson } from "@/lib/crypto";
import { audit } from "@/lib/events";
import { checkTotp, newRecoveryCodes, newTotpSecret } from "@/lib/two-step";

const SETUP = "aiba_totp_setup";
export type SecState = { ok?: boolean; error?: string; message?: string; codes?: string[] } | null;

export async function startTotp() {
  await requireUser();
  (await cookies()).set(SETUP, encryptJson(newTotpSecret()), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 900 });
  revalidatePath("/account/security");
}

export async function confirmTotp(_p: SecState, f: FormData): Promise<SecState> {
  const u = await requireUser();
  const t = await getT();
  const raw = (await cookies()).get(SETUP)?.value;
  if (!raw) return { error: t("This request expired. Try again.") };
  const secret = decryptJson<string>(raw);
  if (!checkTotp(secret, String(f.get("code") ?? ""))) return { error: t("That code isn't valid. Try again.") };
  await db.update(schema.users).set({ totpSecret: encryptJson(secret) }).where(eq(schema.users.id, u.id));
  (await cookies()).delete(SETUP);
  const codes = await newRecoveryCodes(u.id);
  await audit(null, { type: "user", id: u.id }, "security.totp_enabled", u.id);
  revalidatePath("/account/security");
  return { ok: true, message: t("Authenticator app activated. Save these recovery codes somewhere safe: each works once if you lose your phone."), codes };
}

export async function disableTotp() {
  const u = await requireUser();
  await db.update(schema.users).set({ totpSecret: null }).where(eq(schema.users.id, u.id));
  await audit(null, { type: "user", id: u.id }, "security.totp_disabled", u.id);
  revalidatePath("/account/security");
}

export async function regenerateCodes(_p: SecState): Promise<SecState> {
  const u = await requireUser();
  const t = await getT();
  const codes = await newRecoveryCodes(u.id);
  await audit(null, { type: "user", id: u.id }, "security.recovery_regenerated", u.id);
  return { ok: true, message: t("New recovery codes. The old ones no longer work."), codes };
}

export async function deletePasskey(f: FormData) {
  const u = await requireUser();
  const [me] = await db.select().from(schema.users).where(eq(schema.users.id, u.id));
  const keys = await db.select({ id: schema.passkeys.id }).from(schema.passkeys).where(eq(schema.passkeys.userId, u.id));
  if (me?.requirePasskey && keys.length <= 1) return; // never leave a passkey-only account without one
  await db.delete(schema.passkeys).where(and(eq(schema.passkeys.id, String(f.get("id"))), eq(schema.passkeys.userId, u.id)));
  await audit(null, { type: "user", id: u.id }, "security.passkey_removed", u.id);
  revalidatePath("/account/security");
}

export async function signOutSession(f: FormData) {
  const u = await requireUser();
  await db.delete(schema.sessions).where(and(eq(schema.sessions.id, String(f.get("id"))), eq(schema.sessions.userId, u.id)));
  await audit(null, { type: "user", id: u.id }, "security.session_revoked", u.id);
  revalidatePath("/account/security");
}

export async function signOutOthers() {
  const u = await requireUser();
  const { cookies: c } = await import("next/headers");
  const { SESSION_COOKIE } = await import("@/lib/auth");
  const { sha256 } = await import("@/lib/crypto");
  const { ne } = await import("drizzle-orm");
  const token = (await c()).get(SESSION_COOKIE)?.value ?? "";
  await db.delete(schema.sessions).where(and(eq(schema.sessions.userId, u.id), ne(schema.sessions.tokenHash, sha256(token))));
  await audit(null, { type: "user", id: u.id }, "security.sessions_revoked_others", u.id);
  revalidatePath("/account/security");
}
