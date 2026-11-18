import { getT } from "@/i18n/server";
import { updateLead } from "@/actions/admin";
import { Table, Td, fmtDate } from "@/components/admin/table";
import { SubmitButton } from "@/components/client";
import { Badge, Card, Empty, Input, PageHeader, Stat } from "@/components/ui";
import { requirePlatform } from "@/lib/auth";
import { platformCan } from "@/lib/platform-rbac";
import { listLeads } from "@/lib/leads";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Website leads") };
}

const STATUS_TONE = { new: "warn", contacted: "neutral", approved: "ok", rejected: "bad" } as const;

export default async function AdminLeads({ searchParams }: { searchParams: Promise<{ kind?: string; status?: string; q?: string }> }) {
  const t = await getT();
  const me = await requirePlatform("businesses.view");
  const canEdit = platformCan(me.platformRole, "businesses.manage");
  const { kind = "", status = "", q = "" } = await searchParams;
  const rows = await listLeads({ kind, status, q });
  const all = await listLeads();
  const n = (k: string) => all.filter((l) => l.kind === k).length;
  return (
    <>
      <PageHeader eyebrow={t("Customers")} title={t("Website leads")} description={t("Waitlist sign-ups and access requests sent from the public website.")} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={t("Waitlist")} value={n("waitlist")} icon="users" />
        <Stat label={t("Access requests")} value={n("access_request")} icon="shield" tone="ai" />
        <Stat label={t("New")} value={all.filter((l) => l.status === "new").length} icon="bell" />
        <Stat label={t("Approved")} value={all.filter((l) => l.status === "approved").length} icon="check" />
      </div>
      <form className="mb-4 flex flex-wrap gap-2">
        <Input name="q" defaultValue={q} placeholder={t("Search name or email…")} className="max-w-sm" />
        <select name="kind" defaultValue={kind} className="h-10 rounded-[10px] border border-border bg-surface px-3 text-[14px]">
          <option value="">{t("All")}</option>
          <option value="waitlist">{t("Waitlist")}</option>
          <option value="access_request">{t("Access requests")}</option>
        </select>
        <select name="status" defaultValue={status} className="h-10 rounded-[10px] border border-border bg-surface px-3 text-[14px]">
          <option value="">{t("Any status")}</option>
          <option value="new">{t("New")}</option>
          <option value="contacted">{t("Contacted")}</option>
          <option value="approved">{t("Approved")}</option>
          <option value="rejected">{t("Rejected")}</option>
        </select>
        <button className="h-10 rounded-[10px] border border-border bg-surface px-4 text-[14px] hover:bg-subtle">{t("Filter")}</button>
      </form>
      <Card>
        <Table head={[t("Person"), t("Details"), t("Source"), t("Status"), t("Created")]} empty={!rows.length && <Empty icon="users" title={t("No leads yet")} />}>
          {rows.map((l) => (
            <tr key={l.id} className="align-top hover:bg-subtle/50">
              <Td>
                <div className="font-medium">{l.name || "—"}</div>
                <a href={`mailto:${l.email}`} className="text-[13px] text-muted hover:underline">{l.email}</a>
                {l.phone && <div className="text-[12px] text-faint">{l.phone}</div>}
              </Td>
              <Td className="max-w-[320px] text-[13px]">
                <Badge tone={l.kind === "access_request" ? "ai" : "neutral"}>{l.kind === "access_request" ? t("Access request") : t("Waitlist")}</Badge>
                {l.businessName && <div className="mt-1">{l.businessName}{l.category ? ` · ${l.category}` : ""}</div>}
                {l.website && <div className="truncate"><a href={l.website} target="_blank" rel="noreferrer" className="text-muted hover:underline">{l.website}</a></div>}
                {l.links.map((u) => <div key={u} className="truncate"><a href={u} target="_blank" rel="noreferrer" className="text-muted hover:underline">{u}</a></div>)}
                {l.message && <p className="mt-1 whitespace-pre-line text-faint">{l.message}</p>}
              </Td>
              <Td className="text-[12px] text-muted">{l.source || "—"}<div>{l.locale}</div></Td>
              <Td>
                {canEdit ? (
                  <form action={updateLead} className="flex min-w-[200px] flex-col gap-1.5">
                    <input type="hidden" name="id" value={l.id} />
                    <select name="status" defaultValue={l.status} className="h-8 rounded-md border border-border bg-surface px-2 text-[13px]">
                      <option value="new">{t("New")}</option>
                      <option value="contacted">{t("Contacted")}</option>
                      <option value="approved">{t("Approved")}</option>
                      <option value="rejected">{t("Rejected")}</option>
                    </select>
                    <input name="notes" defaultValue={l.notes} placeholder={t("Notes")} className="h-8 rounded-md border border-border bg-surface px-2 text-[13px]" />
                    <SubmitButton size="sm" variant="ghost">{t("Save")}</SubmitButton>
                  </form>
                ) : (
                  <Badge tone={STATUS_TONE[l.status]}>{t(l.status === "new" ? "New" : l.status === "contacted" ? "Contacted" : l.status === "approved" ? "Approved" : "Rejected")}</Badge>
                )}
              </Td>
              <Td className="text-muted">{fmtDate(l.createdAt)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
