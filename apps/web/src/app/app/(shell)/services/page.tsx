import { archiveService, saveService } from "@/actions/workspace";
import { ConfirmSubmit, SubmitButton, Toggle } from "@/components/client";
import { Badge, Card, CardHeader, Empty, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/workspace/action-form";
import { listServices, listStaff } from "@/lib/queries";
import { currentTenant, requirePermission } from "@/lib/tenant";
import { formatMoney } from "@/lib/time";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Services") };
}

type Svc = Awaited<ReturnType<typeof listServices>>[number];
type St = Awaited<ReturnType<typeof listStaff>>[number];

async function ServiceFields({ s, staff }: { s?: Svc; staff: St[] }) {
  const t = await getT();
  return (
    <div className="space-y-3">
      {s && <input type="hidden" name="id" value={s.id} />}
      <Field label={t("Name")}><Input name="name" defaultValue={s?.name} required /></Field>
      <Field label={t("Description")}><Textarea name="description" rows={2} defaultValue={s?.description} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label={t("Minutes")}><Input name="durationMinutes" type="number" min={5} step={5} defaultValue={s?.durationMinutes ?? 60} required /></Field>
        <Field label={t("Buffer")} hint={t("min")}><Input name="bufferMinutes" type="number" min={0} step={5} defaultValue={s?.bufferMinutes ?? 0} /></Field>
        <Field label={t("Price")}><Input name="price" type="number" min={0} step="0.01" defaultValue={s ? s.priceCents / 100 : ""} required /></Field>
      </div>
      <div>
        <div className="mb-1.5 text-[13px] font-medium">{t("Performed by")} <span className="font-normal text-faint">(none = anyone)</span></div>
        <div className="flex flex-wrap gap-2">
          {staff.filter((x) => x.active).map((x) => (
            <label key={x.id} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[13px] has-checked:border-fg has-checked:bg-subtle">
              <input type="checkbox" name="staffIds" value={x.id} defaultChecked={s?.staffIds.includes(x.id)} className="accent-current" /> {x.name}
            </label>
          ))}
        </div>
      </div>
      {s && <Toggle name="active" defaultChecked={s.active} label={t("Bookable")} description={t("Inactive services are hidden from customers and the agent.")} />}
    </div>
  );
}

export default async function ServicesPage() {
  const t = await getT();
  const tenant = await currentTenant();
  requirePermission(tenant, "catalog.manage");
  const [services, staff] = await Promise.all([listServices(tenant.business.id), listStaff(tenant.business.id)]);
  return (
    <>
      <PageHeader eyebrow={t("Business")} title={t("Services")} description={t("What customers can book. Your agent quotes these prices and durations exactly.")} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader title={t("New service")} />
          <ActionForm action={saveService} className="p-5" resetOnSuccess>
            <ServiceFields staff={staff} />
            <SubmitButton className="mt-4">{t("Add service")}</SubmitButton>
          </ActionForm>
        </Card>
        <Card className="lg:col-span-2">
          {services.length === 0 ? (
            <Empty icon="scissors" title={t("No services yet")}>{t("Add your first service to open bookings.")}</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {services.map((s) => (
                <li key={s.id} className="px-5 py-4">
                  <details>
                    <summary className="flex cursor-pointer list-none items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 font-medium">{s.name} {!s.active && <Badge>{t("Inactive")}</Badge>}</div>
                        <div className="truncate text-[13px] text-muted">{s.description || t("No description")}</div>
                      </div>
                      <div className="text-right text-[14px] tabular-nums">
                        <div className="font-semibold">{formatMoney(s.priceCents, tenant.business.currency)}</div>
                        <div className="text-[12px] text-muted">{s.durationMinutes} min{s.bufferMinutes ? ` + ${s.bufferMinutes}` : ""}</div>
                      </div>
                    </summary>
                    <ActionForm action={saveService} className="mt-4 rounded-lg bg-subtle/50 p-4">
                      <ServiceFields s={s} staff={staff} />
                      <SubmitButton size="sm" className="mt-4">{t("Save")}</SubmitButton>
                    </ActionForm>
                    {s.active && (
                      <form action={archiveService} className="mt-2">
                        <input type="hidden" name="id" value={s.id} />
                        <ConfirmSubmit message={t("Archive this service? Existing bookings are kept.")} variant="ghost">{t("Archive")}</ConfirmSubmit>
                      </form>
                    )}
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
