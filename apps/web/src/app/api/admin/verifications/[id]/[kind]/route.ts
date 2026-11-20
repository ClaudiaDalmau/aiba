import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePlatform } from "@/lib/auth";
import { decryptJson } from "@/lib/crypto";
import { audit } from "@/lib/events";

/** Serves one identity image to platform admins while the check is pending (never cached). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string; kind: string }> }) {
  const admin = await requirePlatform("users.manage");
  const { id, kind } = await ctx.params;
  const [c] = await db.select().from(schema.identityChecks).where(eq(schema.identityChecks.id, id));
  const blob = kind === "document" ? c?.documentImage : kind === "selfie" ? c?.selfieImage : null;
  if (!blob) return new Response("Not found", { status: 404 });
  const dataUrl = decryptJson<string>(blob);
  const [, mime, b64] = /^data:([^;]+);base64,(.*)$/.exec(dataUrl) ?? [];
  await audit(null, { type: "user", id: admin.id }, "identity.viewed", id, { kind });
  return new Response(Buffer.from(b64 ?? "", "base64"), { headers: { "content-type": mime || "image/jpeg", "cache-control": "no-store, private", "x-robots-tag": "noindex" } });
}
