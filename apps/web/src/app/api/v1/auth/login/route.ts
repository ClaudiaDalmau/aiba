import { sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { body, publicRoute } from "@/lib/api";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { verifyPassword } from "@/lib/crypto";
import { AppError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { noteSignIn } from "@/lib/devices";
import { checkTotp, needsSecondStep, readTotpSecret, redeemRecoveryCode } from "@/lib/two-step";

const Body = z.object({ email: z.email(), password: z.string().min(1), client: z.enum(["web", "mobile"]).default("web"), code: z.string().max(20).optional() });

export const POST = publicRoute(async (req) => {
  rateLimit(req, "login", 10, 60_000);
  const input = await body(req, Body);
  const [user] = await db.select().from(schema.users).where(sql`lower(${schema.users.email}) = ${input.email.toLowerCase()}`);
  if (!user || user.disabled || !(await verifyPassword(input.password, user.passwordHash))) throw new AppError(401, "invalid_credentials", "Email or password is incorrect");
  const second = await needsSecondStep(user);
  if (second.required) {
    if (second.mustUsePasskey) throw new AppError(401, "passkey_required", "This account signs in with its passkey (fingerprint or face). Use the website.");
    const secret = readTotpSecret(user);
    if (!input.code) throw new AppError(401, "two_step_required", "Enter the 6-digit code from your authenticator app.");
    if (!(secret && checkTotp(secret, input.code)) && !(await redeemRecoveryCode(user, input.code))) throw new AppError(401, "invalid_code", "That code isn't valid. Try again.");
  }
  const { token, expiresAt, id: sid } = await createSession(user.id, input.client);
  await noteSignIn(user, req.headers.get("user-agent") ?? "", sid);
  const res = Response.json({ token: input.client === "mobile" ? token : undefined, user: { id: user.id, email: user.email, name: user.name, platformRole: user.platformRole } });
  if (input.client === "web") res.headers.append("set-cookie", `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return res;
});
