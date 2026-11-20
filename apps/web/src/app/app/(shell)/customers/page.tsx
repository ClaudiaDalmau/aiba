import { getT } from "@/i18n/server";
import Link from "next/link";
import { Avatar, Card, Empty, Input, LinkButton, PageHeader } from "@/components/ui";
import { listCustomers } from "@/lib/queries";
import { currentTenant } from "@/lib/tenant";
import { formatDate, formatMoney } from "@/lib/time";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Customers") };
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const t = await getT();
  const tenant = await currentTenant();
  const { q } = await searchParams;
  const customers = await listCustomers(tenant.business.id, q);
  return (
    <>
      <PageHeader
        title={t("Customers")}
        description={t("Everyone who booked or messaged you. Your customer data stays yours and is never shared with other businesses.")}
        actions={
          <>
            <LinkButton href="/app/customers/import" variant="secondary" icon="plus">{t("Import")}</LinkButton>
            <a href="/api/v1/customers/export.csv" className="inline-flex h-10 items-center rounded-lg px-3 text-[14px] font-medium text-muted hover:bg-subtle hover:text-fg">{t("Export CSV")}</a>
          </>
        }
      />
      <form className="mb-4 max-w-sm"><Input name="q" defaultValue={q} placeholder={t("Search name, email or phone")} /></form>
      <Card className="overflow-x-auto">
        {customers.length === 0 ? (
          <Empty icon="users" title={t("No customers yet")} />
        ) : (
          <table className="w-full text-[14px]">
            <thead className="border-b border-border text-left text-[12px] uppercase tracking-wider text-faint">
              <tr><th className="px-5 py-3 font-medium">{t("Customer")}</th><th className="px-5 py-3 font-medium">{t("Contact")}</th><th className="px-5 py-3 text-right font-medium">{t("Bookings")}</th><th className="px-5 py-3 text-right font-medium">{t("Spent")}</th><th className="px-5 py-3 font-medium">{t("Last visit")}</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-subtle/50">
                  <td className="px-5 py-3"><Link href={`/app/customers/${c.id}`} className="flex items-center gap-2.5 font-medium"><Avatar name={c.name} size={28} />{c.name}</Link></td>
                  <td className="px-5 py-3 text-muted">{[c.phone, c.email].filter(Boolean).join(" · ") || (c.telegramChatId ? "Telegram" : "—")}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{c.bookings}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatMoney(c.spentCents, tenant.business.currency)}</td>
                  <td className="px-5 py-3 text-muted">{c.lastVisit ? formatDate(new Date(c.lastVisit), tenant.business.timezone) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
