import { getT } from "@/i18n/server";
import { asc, eq } from "drizzle-orm";
import { deleteQuickReply, saveQuickReply } from "@/actions/quick-replies";
import { ConfirmSubmit, SubmitButton } from "@/components/client";
import { Field, Input, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/workspace/action-form";
import { db, schema } from "@/db";
import { currentTenant } from "@/lib/tenant";

export default async function QuickRepliesPage() {
  const t = await getT();
  const tenant = await currentTenant();
  const replies = await db.select().from(schema.quickReplies).where(eq(schema.quickReplies.businessId, tenant.business.id)).orderBy(asc(schema.quickReplies.title));
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-5">
      <h2 className="text-[18px] font-semibold">{t("Quick replies")}</h2>
      <p className="mt-1 max-w-xl text-[14px] text-muted">{t("Answers you write often (address, how to pay, what to bring…). Insert them with the ⚡ button when replying. {name} becomes the customer's first name.")}</p>
      <ActionForm action={saveQuickReply} className="mt-5 max-w-xl space-y-3 rounded-xl border border-border p-4" resetOnSuccess>
        <Field label={t("Title")}><Input name="title" placeholder={t("e.g. How to get here")} maxLength={60} required /></Field>
        <Field label={t("Text")}><Textarea name="body" rows={3} placeholder={t("Hi {name}! We're at…")} required /></Field>
        <SubmitButton size="sm">{t("Add quick reply")}</SubmitButton>
      </ActionForm>
      <ul className="mt-6 max-w-xl space-y-3">
        {replies.map((r) => (
          <li key={r.id} className="rounded-xl border border-border p-4">
            <details>
              <summary className="flex cursor-pointer list-none items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium">{r.title}</div>
                  <div className="whitespace-pre-wrap text-[13px] text-muted">{r.body}</div>
                </div>
                <span className="text-[12px] text-faint">{t("used {n}×", { n: r.uses })}</span>
              </summary>
              <ActionForm action={saveQuickReply} className="mt-3 space-y-3">
                <input type="hidden" name="id" value={r.id} />
                <Input name="title" defaultValue={r.title} maxLength={60} required />
                <Textarea name="body" rows={3} defaultValue={r.body} required />
                <SubmitButton size="sm" variant="secondary">{t("Save")}</SubmitButton>
              </ActionForm>
              <form action={deleteQuickReply} className="mt-2">
                <input type="hidden" name="id" value={r.id} />
                <ConfirmSubmit message={t("Delete this quick reply?")} variant="ghost" size="sm">{t("Delete")}</ConfirmSubmit>
              </form>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
