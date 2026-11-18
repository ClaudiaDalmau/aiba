import { deleteKnowledge, saveKnowledge, uploadKnowledge } from "@/actions/workspace";
import { ConfirmSubmit, SubmitButton } from "@/components/client";
import { Badge, Card, CardHeader, Empty, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/workspace/action-form";
import { listKnowledge } from "@/lib/knowledge";
import { currentTenant, requirePermission } from "@/lib/tenant";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Knowledge") };
}

const KIND = { faq: "FAQ", policy: "Policy", document: "Document", note: "Note" } as const;

export default async function KnowledgePage() {
  const t = await getT();
  const tenant = await currentTenant();
  requirePermission(tenant, "agent.manage");
  const items = await listKnowledge(tenant.business.id);
  return (
    <>
      <PageHeader eyebrow={t("AI assistant")} title={t("Knowledge")} description={t("Everything your agent can cite beyond your services, team, hours and policies (which it learns automatically). Keep entries short and factual.")} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardHeader title={t("Add an entry")} />
            <ActionForm action={saveKnowledge} className="space-y-3 p-5" resetOnSuccess>
              <Field label={t("Type")}>
                <Select name="kind" defaultValue="faq"><option value="faq">{t("FAQ")}</option><option value="policy">{t("Policy")}</option><option value="note">{t("Note")}</option><option value="document">{t("Document")}</option></Select>
              </Field>
              <Field label={t("Title / question")}><Input name="title" required placeholder={t("Do you have parking?")} /></Field>
              <Field label={t("Answer / content")}><Textarea name="content" rows={5} required /></Field>
              <SubmitButton>{t("Add")}</SubmitButton>
            </ActionForm>
          </Card>
          <Card>
            <CardHeader title={t("Upload a document")} description={t(".txt, .md, .csv, .json or .html · up to 1 MB")} />
            <ActionForm action={uploadKnowledge} className="space-y-3 p-5" resetOnSuccess>
              <input type="file" name="file" accept=".txt,.md,.csv,.json,.html,.htm" className="block w-full text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-subtle file:px-3 file:py-2 file:text-[13px]" required />
              <SubmitButton variant="secondary">{t("Upload")}</SubmitButton>
            </ActionForm>
          </Card>
        </div>
        <Card className="lg:col-span-2">
          <CardHeader title={t("{n} entries", { n: items.length })} description={t("Short entries are always in the agent's context; long documents are searched when relevant.")} />
          {items.length === 0 ? (
            <Empty icon="book" title={t("No knowledge yet")}>{t("Start with your most common questions: parking, payment methods, what to bring, late policy.")}</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((k) => (
                <li key={k.id} className="group px-5 py-4">
                  <details>
                    <summary className="flex cursor-pointer list-none items-start gap-3">
                      <Badge tone={k.kind === "policy" ? "warn" : k.kind === "document" ? "ai" : "neutral"}>{KIND[k.kind]}</Badge>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{k.title}</div>
                        <div className="line-clamp-2 text-[13px] text-muted">{k.content}</div>
                      </div>
                      <span className="text-[12px] text-faint">{k.content.length > 1200 ? `${Math.round(k.content.length / 1000)}k chars · searched` : "always loaded"}</span>
                    </summary>
                    <ActionForm action={saveKnowledge} className="mt-4 space-y-3">
                      <input type="hidden" name="id" value={k.id} />
                      <input type="hidden" name="kind" value={k.kind} />
                      <Input name="title" defaultValue={k.title} />
                      <Textarea name="content" defaultValue={k.content} rows={6} />
                      <div className="flex gap-2"><SubmitButton size="sm">{t("Save")}</SubmitButton></div>
                    </ActionForm>
                    <form action={deleteKnowledge} className="mt-2">
                      <input type="hidden" name="id" value={k.id} />
                      <ConfirmSubmit message={t("Delete this entry?")} variant="ghost" icon="trash">{t("Delete")}</ConfirmSubmit>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
