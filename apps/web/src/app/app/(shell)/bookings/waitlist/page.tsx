import { getT } from "@/i18n/server";
import { requestIntlLocale } from "@/i18n/request-locale";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ConfirmSubmit } from "@/components/client";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { currentTenant, tenantFor } from "@/lib/tenant";
import { listWaitlist, removeFromWaitlist } from "@/lib/waitlist";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Waitlist") };
}

async function remove(f: FormData) {
  "use server";
  const t = await tenantFor("bookings.manage");
  await removeFromWaitlist(t.business.id, String(f.get("id")));
  revalidatePath("/app/bookings/waitlist");
}

export default async function WaitlistPage() {
  const t = await getT();
  const tenant = await currentTenant();
  const rows = await listWaitlist(tenant.business);
  const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString(requestIntlLocale(), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  const byDay = new Map<string, typeof rows>();
  for (const r of rows) byDay.set(r.w.date, [...(byDay.get(r.w.date) ?? []), r]);
  return (
    <>
      <PageHeader
        eyebrow={<Link href="/app/bookings" className="hover:underline">{t("Bookings")}</Link>}
        title={t("Waitlist")}
        description={t("Customers who want a slot on a full day. When a booking on that day is cancelled or moved, the first ones in line get a message with the link to book (first come, first served).")}
      />
      {rows.length === 0 ? (
        <Card><Empty icon="bell" title={t("Nobody is waiting")}>{t("Customers can join from your booking page on a full day, or ask your assistant.")}</Empty></Card>
      ) : (
        <div className="space-y-6">
          {[...byDay.entries()].map(([day, list]) => (
            <Card key={day}>
              <div className="border-b border-border px-5 py-3 text-[14px] font-semibold capitalize">{fmt(day)}</div>
              <ul className="divide-y divide-border">
                {list.map(({ w, customer, service }, i) => (
                  <li key={w.id} className="flex items-center gap-3 px-5 py-3 text-[14px]">
                    <span className="w-6 text-[12px] font-semibold text-faint">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/app/customers/${w.customerId}`} className="font-medium hover:underline">{customer}</Link>
                      <div className="text-[13px] text-muted">{service} · {t("via {source}", { source: t(w.source) })}</div>
                    </div>
                    <Badge tone={w.status === "notified" ? "ok" : "neutral"}>{w.status === "notified" ? t("Notified") : t("Waiting")}</Badge>
                    <form action={remove}>
                      <input type="hidden" name="id" value={w.id} />
                      <ConfirmSubmit message={t("Remove from the waitlist?")} variant="ghost" size="sm">{t("Remove")}</ConfirmSubmit>
                    </form>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
