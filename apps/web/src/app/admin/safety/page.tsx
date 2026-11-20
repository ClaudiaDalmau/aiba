import { getT } from "@/i18n/server";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { updateSafetyAlert } from "@/actions/safety";
import { fmtDate } from "@/components/admin/table";
import { SubmitButton } from "@/components/client";
import { Badge, Card, Empty, PageHeader, Select, Textarea } from "@/components/ui";
import { db, schema } from "@/db";
import { requirePlatform } from "@/lib/auth";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Safety alerts") };
}

export default async function AdminSafety() {
  const t = await getT();
  await requirePlatform("users.manage");
  const rows = await db
    .select({ a: schema.safetyAlerts, u: { id: schema.users.id, name: schema.users.name, email: schema.users.email } })
    .from(schema.safetyAlerts)
    .innerJoin(schema.users, eq(schema.users.id, schema.safetyAlerts.userId))
    .orderBy(desc(schema.safetyAlerts.urgent), desc(schema.safetyAlerts.createdAt))
    .limit(200);
  return (
    <>
      <PageHeader eyebrow={t("Customers")} title={t("Safety alerts")} description={t("Confidential help requests and support messages. Never contact the person through a channel she didn't give you, and never through her business inbox: someone else may be reading it.")} />
      {rows.length === 0 ? (
        <Card><Empty icon="bell" title={t("No alerts")}>{t("Requests sent from Support appear here and by email to the team inbox.")}</Empty></Card>
      ) : (
        <div className="space-y-4">
          {rows.map(({ a, u }) => (
            <Card key={a.id} className={a.urgent && a.status !== "closed" ? "border-bad/40 p-5" : "p-5"}>
              <div className="flex flex-wrap items-center gap-2 text-[14px]">
                {a.urgent && <Badge tone="bad">{t("Urgent")}</Badge>}
                <Badge tone={a.status === "closed" ? "neutral" : a.status === "in_progress" ? "warn" : "ai"}>{a.status}</Badge>
                <Link href={`/admin/users/${u.id}`} className="font-semibold hover:underline">{u.name}</Link>
                <span className="text-muted">{u.email}</span>
                <span className="ml-auto text-[12px] text-faint">{fmtDate(a.createdAt)}</span>
              </div>
              {a.message && <p className="mt-3 whitespace-pre-wrap text-[14px]">{a.message}</p>}
              <p className="mt-2 text-[13px] text-muted">{t("Safe contact")}: {a.contact || t("(not given)")}</p>
              <form action={updateSafetyAlert} className="mt-4 space-y-2">
                <input type="hidden" name="id" value={a.id} />
                <Textarea name="notes" rows={2} defaultValue={a.notes} placeholder={t("Internal notes")} />
                <div className="flex gap-2">
                  <Select name="status" defaultValue={a.status} className="max-w-48">
                    <option value="open">open</option>
                    <option value="in_progress">in_progress</option>
                    <option value="closed">closed</option>
                  </Select>
                  <SubmitButton size="sm" variant="secondary">{t("Save")}</SubmitButton>
                </div>
              </form>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
