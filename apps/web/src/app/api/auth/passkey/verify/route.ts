import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { body, publicRoute } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/events";
import { newId } from "@/lib/ids";
import { finishLogin } from "@/lib/login-finish";
import { rateLimit } from "@/lib/rate-limit";
import { getPending, rp, takeChallenge } from "@/lib/two-step";
import { verifyAssertion, verifyRegistration } from "@/lib/webauthn";

const Body = z.object({
  purpose: z.enum(["register", "login", "second"]),
  name: z.string().max(60).optional(),
  credential: z.object({
    id: z.string(),
    response: z.object({
      clientDataJSON: z.string(),
      attestationObject: z.string().optional(),
      authenticatorData: z.string().optional(),
      signature: z.string().optional(),
      userHandle: z.string().nullish(),
    }),
  }),
});

export const POST = publicRoute(async (req) => {
  rateLimit(req, "passkey", 20, 60_000);
  const input = await body(req, Body);
  const expected = await rp();
  const ua = req.headers.get("user-agent") ?? "";
  if (input.purpose === "register") {
    const ch = await takeChallenge("register");
    if (!ch?.userId) throw new AppError(400, "expired", "This request expired. Try again.");
    const r = input.credential.response;
    if (!r.attestationObject) throw new AppError(400, "bad_request", "Missing attestation");
    const v = verifyRegistration({ clientDataJSON: r.clientDataJSON, attestationObject: r.attestationObject }, { challenge: ch.challenge, origin: expected.origin, rpId: expected.rpId });
    const device = /iPhone|iPad/.test(ua) ? "iPhone / iPad" : /Android/.test(ua) ? "Android" : /Mac/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "";
    await db.insert(schema.passkeys).values({ id: newId("pk"), userId: ch.userId, credentialId: v.credentialId, publicKey: v.publicKey, alg: v.alg, counter: v.counter, name: (input.name || device || "Passkey").slice(0, 60) });
    await audit(null, { type: "user", id: ch.userId }, "security.passkey_added", ch.userId);
    // Enrolling the first passkey during a pending sign-in completes it.
    const signedIn = await currentUser();
    const pending = signedIn ? null : await getPending();
    if (!signedIn && pending?.userId === ch.userId) {
      const [u] = await db.select().from(schema.users).where(eq(schema.users.id, ch.userId));
      return Response.json({ ok: true, redirect: await finishLogin(u, pending.next) });
    }
    return Response.json({ ok: true });
  }
  const ch = await takeChallenge("login");
  if (!ch) throw new AppError(400, "expired", "This request expired. Try again.");
  const [pk] = await db.select().from(schema.passkeys).where(eq(schema.passkeys.credentialId, input.credential.id));
  if (!pk) throw new AppError(401, "unknown_passkey", "This passkey isn't registered in AIBA. Sign in with your password.");
  if (input.purpose === "second" && pk.userId !== ch.userId) throw new AppError(401, "wrong_user", "This passkey belongs to another account.");
  const r = input.credential.response;
  if (!r.authenticatorData || !r.signature) throw new AppError(400, "bad_request", "Missing signature");
  const { counter } = verifyAssertion({ clientDataJSON: r.clientDataJSON, authenticatorData: r.authenticatorData, signature: r.signature }, pk, { challenge: ch.challenge, origin: expected.origin, rpId: expected.rpId });
  await db.update(schema.passkeys).set({ counter, lastUsedAt: new Date() }).where(eq(schema.passkeys.id, pk.id));
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, pk.userId));
  if (!u || u.disabled) throw new AppError(401, "unauthorized", "This account is disabled.");
  await audit(null, { type: "user", id: u.id }, "security.passkey_login", u.id);
  const pending = await getPending();
  return Response.json({ ok: true, redirect: await finishLogin(u, pending?.userId === u.id ? pending.next : null) });
});
