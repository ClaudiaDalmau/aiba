import { getT } from "@/i18n/server";
import Link from "next/link";
import { deletePackAction, savePackAction } from "@/actions/packs";
import { ConfirmSubmit, SubmitButton, Toggle } from "@/components/client";
import { Badge, Card, CardHeader, Empty, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/workspace/action-form";
import { listCustomerPacks, listPacks } from "@/lib/packs";
import { listServices } from "@/lib/queries";
import { currentTenant, requirePermission } from "@/lib/tenant";
import { formatDate, formatMoney } from "@/lib/time";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Packs") };
}

type Row = Awaited<ReturnType<typeof listPacks>>[number];
type Svc = Awaited<ReturnType<typeof listServices>>[number];

async function PackFields({ r, services }: { r?: Row; services: Svc[] }) {
  const t = await getT();
  const p = r?.pack;
  return (
    <div className="space-y-3">
      {p && <input type="hidden" name="id" value={p.id} />}
      <Field label={t("Name")}><Input name="name" defaultValue={p?.name} placeholder={t("e.g. 5 massages")} required /></Field>
      <Field label={t("Service")}>
        <Select name="serviceId" defaultValue={p?.serviceId} required>
          {services.filter((s) => s.active || s.id === p?.serviceId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label={t("Sessions")}><Input name="sessions" type="number" min={2} max={100} defaultValue={p?.sessions ?? 5} required /></Field>
        <Field label={t("Price")}><Input name="price" type="number" min={0.01} step="0.01" defaultValue={p ? p.priceCents / 100 : ""} required /></Field>
        <Field label={t("Valid for")} hint={t("days")}><Input name="validityDays" type="number" min={7} max={1095} defaultValue={p?.validityDays ?? 365} required /></Field>
      </div>
      <Field label={t("Description")} hint={t("optional")}><Textarea name="description" rows={2} defaultValue={p?.description} /></Field>
      {p && <Toggle name="active" defaultChecked={p.active} label={t("On sale")} description={t("Packs not on sale are hidden from the agent. Packs already sold keep working.")} />}
    </div>
  );
}

const STATUS_TONE = { active: "ok", used_up: "neutral", expired: "warn", voided: "bad" } as const;

export default async function PacksPage() {
  const t = await getT();
  const tenant = await currentTenant();
  requirePermission(tenant, "catalog.manage");
  const cur = tenant.business.currency;
  const tz = tenant.business.timezone;
  const [packs, services, sold] = await Promise.all([listPacks(tenant.business.id), listServices(tenant.business.id), listCustomerPacks(tenant.business.id, { limit: 100 })]);
  const STATUS = { active: t("In use"), used_up: t("Used up"), expired: t("Expired"), voided: t("Voided") };
  return (
    <>
      <PageHeader eyebrow={t("Business")} title={t("Packs")} description={t("Prepaid packs of sessions («bonos»). Sell one from a customer's page: their next bookings of that service are covered automatically.")} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader title={t("New pack")} />
          {services.length ? (
            <ActionForm action={savePackAction} className="p-5" resetOnSuccess>
              <PackFields services={services} />
              <SubmitButton className="mt-4">{t("Add pack")}</SubmitButton>
            </ActionForm>
          ) : (
            <p className="p-5 text-[14px] text-muted">{t("Add a service first.")} <Link href="/app/services" className="font-medium text-fg underline">{t("Services")}</Link></p>
          )}
        </Card>
        <div className="space-y-6 lg:col-span-2">
          <Card>
            {packs.length === 0 ? (
              <Empty icon="ticket" title={t("No packs yet")}>{t("For example: 5 sessions for the price of 4. Your agent will tell customers about them.")}</Empty>
            ) : (
              <ul className="divide-y divide-border">
                {packs.map((r) => {
                  const full = r.servicePriceCents * r.pack.sessions;
                  const saving = full > r.pack.priceCents ? Math.round((1 - r.pack.priceCents / full) * 100) : 0;
                  return (
                    <li key={r.pack.id} className="px-5 py-4">
                      <details>
                        <summary className="flex cursor-pointer list-none items-center gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 font-medium">{r.pack.name} {!r.pack.active && <Badge>{t("Not on sale")}</Badge>}</div>
                            <div className="truncate text-[13px] text-muted">{r.pack.sessions} × {r.serviceName} · {t("valid {n} days", { n: r.pack.validityDays })}</div>
                          </div>
                          <div className="text-right text-[14px] tabular-nums">
                            <div className="font-semibold">{formatMoney(r.pack.priceCents, cur)}</div>
                            {saving > 0 && <div className="text-[12px] text-ok">−{saving}%</div>}
                          </div>
                        </summary>
                        <ActionForm action={savePackAction} className="mt-4 rounded-lg bg-subtle/50 p-4">
                          <PackFields r={r} services={services} />
                          <SubmitButton size="sm" className="mt-4">{t("Save")}</SubmitButton>
                        </ActionForm>
                        <form action={deletePackAction} className="mt-2">
                          <input type="hidden" name="id" value={r.pack.id} />
                          <ConfirmSubmit message={t("Delete this pack? Packs already sold keep working.")} variant="ghost" icon="trash">{t("Delete")}</ConfirmSubmit>
                        </form>
                      </details>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title={t("Sold packs")} description={t("Sessions are counted from bookings; a cancelled booking gives the session back.")} />
            {sold.length === 0 ? (
              <p className="px-5 pb-5 text-[14px] text-muted">{t("None yet. Open a customer and use «Sell a pack».")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {sold.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3 text-[14px]">
                    <div className="min-w-0 flex-1">
                      <Link href={`/app/customers/${p.customerId}`} className="font-medium hover:underline">{p.customerName}</Link>
                      <div className="truncate text-[13px] text-muted">{p.name} · {t("until {date}", { date: formatDate(p.expiresAt, tz) })}</div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="font-medium">{t("{used} of {total} used", { used: p.used, total: p.sessionsTotal })}</div>
                      <Badge tone={STATUS_TONE[p.status]}>{STATUS[p.status]}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
