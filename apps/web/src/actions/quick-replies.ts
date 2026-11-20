"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionState } from "@/actions/workspace";
import { db, schema } from "@/db";
import { getT } from "@/i18n/server";
import { newId } from "@/lib/ids";
import { tenantFor } from "@/lib/tenant";

export async function saveQuickReply(_prev: ActionState, f: FormData): Promise<ActionState> {
  const t = await tenantFor("inbox.reply");
  const tr = await getT();
  const title = String(f.get("title") ?? "").trim().slice(0, 60);
  const body = String(f.get("body") ?? "").trim().slice(0, 2000);
  if (!title || !body) return { error: tr("Write a title and the text") };
  const id = String(f.get("id") ?? "");
  if (id) await db.update(schema.quickReplies).set({ title, body }).where(and(eq(schema.quickReplies.id, id), eq(schema.quickReplies.businessId, t.business.id)));
  else await db.insert(schema.quickReplies).values({ id: newId("qr"), businessId: t.business.id, title, body });
  revalidatePath("/app/inbox", "layout");
  return { ok: true, message: tr("Quick reply saved") };
}

export async function deleteQuickReply(f: FormData) {
  const t = await tenantFor("inbox.reply");
  await db.delete(schema.quickReplies).where(and(eq(schema.quickReplies.id, String(f.get("id"))), eq(schema.quickReplies.businessId, t.business.id)));
  revalidatePath("/app/inbox", "layout");
}

export async function countQuickReplyUse(id: string) {
  const t = await tenantFor("inbox.reply");
  await db.update(schema.quickReplies).set({ uses: sql`${schema.quickReplies.uses} + 1` }).where(and(eq(schema.quickReplies.id, id), eq(schema.quickReplies.businessId, t.business.id)));
}
