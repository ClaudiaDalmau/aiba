import { getT } from "@/i18n/server";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Table, Td, fmtDate } from "@/components/admin/table";
import { Badge, Card, CardHeader, Empty, PageHeader, type Tone } from "@/components/ui";
import { db, schema } from "@/db";
import { requirePlatform } from "@/lib/auth";
import { listPlans } from "@/lib/plans";
import { formatMoney } from "@/lib/time";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Payments") };
}

const SUB_TONE: Record<string, Tone> = { active: "ok", trialing: "ai", past_due: "warn", canceled: "bad" };
const PAY_TONE: Record<string, Tone> = { paid: "ok", pending: "warn", unpaid: "neutral", refunded: "bad" };

export default async function AdminPayments() {
  const t = await getT();
  await requirePlatform("billing.view");
  const planNames = new Map((await listPlans()).map((p) => [p.id, p]));
  const [subs, payments] = await Promise.all([
    db
      .select({ sub: schema.subscriptions, businessName: schema.businesses.name })
      .from(schema.subscriptions)
      .innerJoin(schema.businesses, eq(schema.businesses.id, schema.subscriptions.businessId))
      .orderBy(desc(schema.subscriptions.updatedAt)),
    db
      .select({ payment: schema.payments, businessName: schema.businesses.name })
      .from(schema.payments)
      .innerJoin(schema.businesses, eq(schema.businesses.id, schema.payments.businessId))
      .orderBy(desc(schema.payments.createdAt))
      .limit(200),
  ]);
  return (
    <>
      <PageHeader eyebrow={t("Platform")} title={t("Payments")} description={t("Subscriptions and online booking payments.")} />
      <Card>
        <CardHeader title={t("Subscriptions")} description={`${subs.length} businesses`} />
        <Table head={[t("Business"), t("Tier"), t("Status"), t("Provider"), t("Period end"), t("Updated")]}>
          {subs.map(({ sub, businessName }) => (
            <tr key={sub.businessId} className="hover:bg-subtle/50">
              <Td><Link href={`/admin/businesses/${sub.businessId}`} className="font-medium hover:underline">{businessName}</Link></Td>
              <Td><Badge tone={planNames.get(sub.tier)?.entitlements.community ? "ai" : "neutral"}>{planNames.get(sub.tier)?.name ?? sub.tier}</Badge></Td>
              <Td><Badge tone={SUB_TONE[sub.status]}>{sub.status}</Badge></Td>
              <Td className="capitalize text-muted">{sub.provider}{sub.providerSubscriptionId ? <div className="font-mono text-[11px] text-faint">{sub.providerSubscriptionId}</div> : null}</Td>
              <Td className="whitespace-nowrap text-muted">{fmtDate(sub.currentPeriodEnd)}</Td>
              <Td className="whitespace-nowrap text-muted">{fmtDate(sub.updatedAt)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card className="mt-6">
        <CardHeader title={t("Booking payments")} />
        <Table head={[t("When"), t("Business"), t("Amount"), t("Status"), t("Provider"), t("Booking")]} empty={!payments.length && <Empty icon="card" title={t("No online payments yet")}>{t("Booking payments appear here once a business requires payment at booking.")}</Empty>}>
          {payments.map(({ payment: p, businessName }) => (
            <tr key={p.id}>
              <Td className="whitespace-nowrap text-muted">{fmtDate(p.createdAt)}</Td>
              <Td>{businessName}</Td>
              <Td className="tabular-nums">{formatMoney(p.amountCents, p.currency)}</Td>
              <Td><Badge tone={PAY_TONE[p.status]}>{p.status}</Badge></Td>
              <Td className="capitalize text-muted">{p.provider}</Td>
              <Td mono>{p.bookingId ?? "—"}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
