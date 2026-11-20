import { getT } from "@/i18n/server";
import { desc, eq, inArray } from "drizzle-orm";
import { decideIdentity } from "@/actions/identity-admin";
import { fmtDate } from "@/components/admin/table";
import { ConfirmSubmit, SubmitButton } from "@/components/client";
import { Badge, Card, Empty, Input, PageHeader } from "@/components/ui";
import { db, schema } from "@/db";
import { requirePlatform } from "@/lib/auth";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Verifications") };
}

const DOC: Record<string, string> = { id_card: "National ID card", passport: "Passport", residence_permit: "Residence permit", driving_licence: "Driving licence" };

export default async function AdminVerifications() {
  const t = await getT();
  await requirePlatform("users.manage");
  const rows = await db
    .select({ c: { id: schema.identityChecks.id, status: schema.identityChecks.status, documentType: schema.identityChecks.documentType, reason: schema.identityChecks.reason, createdAt: schema.identityChecks.createdAt, reviewedAt: schema.identityChecks.reviewedAt }, u: { id: schema.users.id, name: schema.users.name, email: schema.users.email } })
    .from(schema.identityChecks)
    .innerJoin(schema.users, eq(schema.users.id, schema.identityChecks.userId))
    .where(inArray(schema.identityChecks.status, ["pending", "approved", "rejected"]))
    .orderBy(desc(schema.identityChecks.createdAt))
    .limit(100);
  const pending = rows.filter((r) => r.c.status === "pending");
  const done = rows.filter((r) => r.c.status !== "pending");
  return (
    <>
      <PageHeader eyebrow={t("Customers")} title={t("Verifications")} description={t("Sensible: compare the document photo with the selfie holding it (same person, adult, document valid and not edited). Photos are deleted as soon as you decide.")} />
      {pending.length === 0 ? (
        <Card><Empty icon="shield" title={t("Nothing to review")}>{t("New requests appear here and arrive by email to the team inbox.")}</Empty></Card>
      ) : (
        <div className="space-y-6">
          {pending.map(({ c, u }) => (
            <Card key={c.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2 text-[14px]">
                <span className="font-semibold">{u.name}</span>
                <span className="text-muted">{u.email}</span>
                <Badge>{t(DOC[c.documentType] ?? c.documentType)}</Badge>
                <span className="text-[12px] text-faint">{fmtDate(c.createdAt)}</span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/admin/verifications/${c.id}/document`} alt={t("Document")} className="w-full rounded-lg border border-border" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/admin/verifications/${c.id}/selfie`} alt="Selfie" className="w-full rounded-lg border border-border" />
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <form action={decideIdentity}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="decision" value="approve" />
                  <SubmitButton icon="check">{t("Approve")}</SubmitButton>
                </form>
                <form action={decideIdentity} className="flex flex-1 items-end gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="decision" value="reject" />
                  <Input name="reason" placeholder={t("Reason (sent to the person), e.g. blurry photo")} className="min-w-48 flex-1" />
                  <ConfirmSubmit message={t("Reject and delete the photos?")}>{t("Reject")}</ConfirmSubmit>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
      {done.length > 0 && (
        <Card className="mt-8">
          <ul className="divide-y divide-border">
            {done.map(({ c, u }) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-2.5 text-[13px]">
                <Badge tone={c.status === "approved" ? "ok" : "bad"}>{c.status === "approved" ? t("Approved") : t("Rejected")}</Badge>
                <span className="font-medium">{u.name}</span>
                <span className="text-muted">{u.email}</span>
                <span className="ml-auto text-faint">{c.reviewedAt ? fmtDate(c.reviewedAt) : ""}{c.reason ? ` · ${c.reason}` : ""}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
