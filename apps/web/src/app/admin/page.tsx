import { getT } from "@/i18n/server";
import { requestIntlLocale } from "@/i18n/request-locale";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Table, Td, eur, fmtDate } from "@/components/admin/table";
import { Badge, Card, CardHeader, PageHeader, Stat } from "@/components/ui";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { listPlans } from "@/lib/plans";
import { platformCan, ROLE_INFO, type PlatformRole } from "@/lib/platform-rbac";
import { Empty } from "@/components/ui";
import { platformMetrics } from "@/lib/metrics";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Overview") };
}

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const t = await getT();
  const me = await requireAdmin();
  const denied = (await searchParams).denied ? (
    <p className="mb-6 rounded-card bg-warn/10 px-4 py-3 text-[14px] text-warn">{t("Your role doesn't include that area. Ask an administrator if you need access.")}</p>
  ) : null;
  if (!platformCan(me.platformRole, "overview.view")) {
    return (
      <>
        {denied}
        <PageHeader eyebrow={t("Platform")} title={t("Welcome, {name}", { name: me.name.split(" ")[0] })} description={t("You're signed in as {role}. Use the menu to open the areas you have access to.", { role: t(ROLE_INFO[me.platformRole as PlatformRole].label) })} />
        <Empty icon="shield" title={t("Nothing to show here for your role")} />
      </>
    );
  }
  const planNames = new Map((await listPlans()).map((p) => [p.id, p]));
  const [metrics, recent] = await Promise.all([
    platformMetrics(30),
    db
      .select({ business: schema.businesses, ownerEmail: schema.users.email })
      .from(schema.businesses)
      .leftJoin(schema.memberships, eq(schema.memberships.businessId, schema.businesses.id))
      .leftJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
      .where(eq(schema.memberships.role, "owner"))
      .orderBy(desc(schema.businesses.createdAt))
      .limit(10),
  ]);
  // platformMetrics builds its object dynamically; read it as a plain record of numbers.
  const m = metrics as Record<string, number>;
  const n = (v: number) => v.toLocaleString(requestIntlLocale());
  return (
    <>
      {denied}
      <PageHeader eyebrow={t("Platform")} title={t("Overview")} description={t("Last 30 days across every tenant.")} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={t("Businesses")} value={n(m.businesses)} sub={t("{published} published · {suspended} suspended", { published: n(m.published), suspended: n(m.suspended) })} icon="building" />
        <Stat label={t("VIP businesses")} value={n(m.vip)} sub={t("{pct}% of tenants", { pct: m.businesses ? Math.round((m.vip / m.businesses) * 100) : 0 })} icon="crown" tone="ai" />
        <Stat label={t("MRR")} value={`€${n(m.mrr)}`} sub={t("{n} paying businesses", { n: n(m.paying) })} icon="card" />
        <Stat label={t("GMV (30d)")} value={eur(m.gmv)} sub={t("{n} bookings", { n: n(m.bookings) })} icon="chart" />
        <Stat label={t("Agent turns (30d)")} value={n(m.agent_turns)} sub={t("{active} active · {error} in error", { active: n(m.active_agents), error: n(m.error_agents) })} icon="sparkles" tone="ai" />
        <Stat label={t("Model tokens (30d)")} value={n(m.tokens)} icon="bolt" />
        <Stat label={t("Messages sent (30d)")} value={n(m.messages_out)} icon="send" />
        <Stat label={t("Channels")} value={n(m.whatsapp + m.telegram)} sub={`${n(m.whatsapp)} WhatsApp · ${n(m.telegram)} Telegram`} icon="plug" />
      </div>

      <Card className="mt-8">
        <CardHeader title={t("Recent signups")} action={<Link href="/admin/businesses" className="text-[13px] text-muted hover:text-fg">{t("All businesses →")}</Link>} />
        <Table head={[t("Business"), t("Owner"), t("Tier"), t("Status"), t("Created")]}>
          {recent.map(({ business: b, ownerEmail }) => (
            <tr key={b.id} className="hover:bg-subtle/50">
              <Td><Link href={`/admin/businesses/${b.id}`} className="font-medium hover:underline">{b.name}</Link><div className="text-[12px] text-faint">/{b.slug}</div></Td>
              <Td className="text-muted">{ownerEmail ?? "—"}</Td>
              <Td><Badge tone={planNames.get(b.tier)?.entitlements.community ? "ai" : "neutral"}>{planNames.get(b.tier)?.name ?? b.tier}</Badge></Td>
              <Td>{b.suspended ? <Badge tone="bad">{t("Suspended")}</Badge> : b.published ? <Badge tone="ok">{t("Live")}</Badge> : <Badge tone="warn">{t("Draft")}</Badge>}</Td>
              <Td className="text-muted">{fmtDate(b.createdAt)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
