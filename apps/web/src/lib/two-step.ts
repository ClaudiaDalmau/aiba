import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { decryptJson, encryptJson, safeEqual, sha256 } from "./crypto";
import { getSettings } from "./settings";

/** Second step at sign-in: passkey (fingerprint / face) or authenticator-app code; one-time recovery codes as fallback. */

export const PENDING_COOKIE = "aiba_pending_login";
export const CHALLENGE_COOKIE = "aiba_wa";

export async function rp() {
  const url = new URL(String((await getSettings())["general.appUrl"]));
  return { rpId: url.hostname, origin: url.origin, name: "AIBA" };
}

export async function needsSecondStep(user: schema.User) {
  const [pk] = await db.select({ id: schema.passkeys.id }).from(schema.passkeys).where(eq(schema.passkeys.userId, user.id)).limit(1);
  return { passkey: Boolean(pk), totp: Boolean(user.totpSecret), required: Boolean(pk || user.totpSecret || user.requirePasskey), mustUsePasskey: user.requirePasskey };
}

export async function setPending(userId: string, next: string | null) {
  (await cookies()).set(PENDING_COOKIE, encryptJson({ u: userId, n: next, exp: Date.now() + 10 * 60_000 }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
}

export async function getPending(): Promise<{ userId: string; next: string | null } | null> {
  const raw = (await cookies()).get(PENDING_COOKIE)?.value;
  if (!raw) return null;
  try {
    const p = decryptJson<{ u: string; n: string | null; exp: number }>(raw);
    return p.exp > Date.now() ? { userId: p.u, next: p.n } : null;
  } catch {
    return null;
  }
}

export async function clearPending() {
  (await cookies()).delete(PENDING_COOKIE);
}

export async function setChallenge(c: { challenge: string; kind: "register" | "login"; userId?: string }) {
  (await cookies()).set(CHALLENGE_COOKIE, encryptJson({ ...c, exp: Date.now() + 5 * 60_000 }), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 300 });
}

export async function takeChallenge(kind: "register" | "login") {
  const jar = await cookies();
  const raw = jar.get(CHALLENGE_COOKIE)?.value;
  jar.delete(CHALLENGE_COOKIE);
  if (!raw) return null;
  try {
    const c = decryptJson<{ challenge: string; kind: string; userId?: string; exp: number }>(raw);
    return c.kind === kind && c.exp > Date.now() ? c : null;
  } catch {
    return null;
  }
}

// ---- TOTP (RFC 6238, SHA-1, 6 digits, 30 s)
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function newTotpSecret() {
  const bytes = randomBytes(20);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  return bits.match(/.{1,5}/g)!.map((c) => B32[parseInt(c.padEnd(5, "0"), 2)]).join("");
}
function b32decode(s: string) {
  let bits = "";
  for (const ch of s.replace(/=+$/, "").toUpperCase()) bits += B32.indexOf(ch).toString(2).padStart(5, "0");
  return Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
}
function totpAt(secret: string, step: number) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(step));
  const h = createHmac("sha1", b32decode(secret)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}
export function checkTotp(secret: string, code: string) {
  const c = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return false;
  const step = Math.floor(Date.now() / 30_000);
  return [-1, 0, 1].some((d) => safeEqual(totpAt(secret, step + d), c));
}
export const totpUri = (secret: string, email: string) => `otpauth://totp/AIBA:${encodeURIComponent(email)}?secret=${secret}&issuer=AIBA&digits=6&period=30`;
export const readTotpSecret = (u: schema.User) => (u.totpSecret ? decryptJson<string>(u.totpSecret) : null);

// ---- recovery codes
export async function newRecoveryCodes(userId: string) {
  const codes = Array.from({ length: 8 }, () => randomBytes(5).toString("hex").replace(/(.{5})/, "$1-"));
  await db.update(schema.users).set({ recoveryCodes: codes.map((c) => sha256(c)) }).where(eq(schema.users.id, userId));
  return codes;
}
export async function redeemRecoveryCode(user: schema.User, code: string) {
  const h = sha256(code.trim().toLowerCase());
  if (!user.recoveryCodes.includes(h)) return false;
  await db.update(schema.users).set({ recoveryCodes: user.recoveryCodes.filter((x) => x !== h) }).where(and(eq(schema.users.id, user.id)));
  return true;
}
export { encryptJson };
