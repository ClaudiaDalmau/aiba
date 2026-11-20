import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { body, publicRoute } from "@/lib/api";
import { currentUser } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { getPending, rp, setChallenge } from "@/lib/two-step";
import { b64u, newChallenge } from "@/lib/webauthn";

const Body = z.object({ purpose: z.enum(["register", "login", "second"]) });

/** WebAuthn options. register: signed-in user (or a pending login that must enrol its first passkey). login: passwordless. second: after the password. */
export const POST = publicRoute(async (req) => {
  rateLimit(req, "passkey", 20, 60_000);
  const { purpose } = await body(req, Body);
  const { rpId, name } = await rp();
  const challenge = newChallenge();
  if (purpose === "register") {
    let user = await currentUser().then((u) => (u ? db.select().from(schema.users).where(eq(schema.users.id, u.id)).then((r) => r[0]) : null));
    if (!user) {
      const p = await getPending();
      if (p) {
        const [u] = await db.select().from(schema.users).where(eq(schema.users.id, p.userId));
        const existing = await db.select({ id: schema.passkeys.id }).from(schema.passkeys).where(eq(schema.passkeys.userId, p.userId));
        if (u?.requirePasskey && !existing.length) user = u;
      }
    }
    if (!user) throw new AppError(401, "unauthorized", "Sign in first");
    const existing = await db.select({ credentialId: schema.passkeys.credentialId }).from(schema.passkeys).where(eq(schema.passkeys.userId, user.id));
    await setChallenge({ challenge, kind: "register", userId: user.id });
    return Response.json({
      publicKey: {
        challenge,
        rp: { id: rpId, name },
        user: { id: b64u.enc(Buffer.from(user.id)), name: user.email, displayName: user.name },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: { residentKey: "preferred", requireResidentKey: false, userVerification: "required" },
        attestation: "none",
        timeout: 120000,
        excludeCredentials: existing.map((e) => ({ type: "public-key", id: e.credentialId })),
      },
    });
  }
  let allow: { type: "public-key"; id: string }[] = [];
  let userId: string | undefined;
  if (purpose === "second") {
    const p = await getPending();
    if (!p) throw new AppError(401, "unauthorized", "Your sign-in expired. Start again.");
    userId = p.userId;
    const keys = await db.select({ credentialId: schema.passkeys.credentialId }).from(schema.passkeys).where(eq(schema.passkeys.userId, p.userId));
    allow = keys.map((k) => ({ type: "public-key", id: k.credentialId }));
  }
  await setChallenge({ challenge, kind: "login", userId });
  return Response.json({ publicKey: { challenge, rpId, userVerification: "required", timeout: 120000, allowCredentials: allow } });
});
