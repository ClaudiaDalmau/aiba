import { getT } from "@/i18n/server";
import { redirect } from "next/navigation";
import { addTravelStop, removeTravelStop } from "@/actions/sensitive";
import { ConfirmSubmit, SubmitButton } from "@/components/client";
import { Card, CardHeader, Empty, Field, Input, PageHeader } from "@/components/ui";
import { ActionForm } from "@/components/workspace/action-form";
import { currentTenant, requirePermission } from "@/lib/tenant";
import { todayIn } from "@/lib/time";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Travel mode") };
}

export default async function TravelPage() {
  const t = await getT();
  const tenant = await currentTenant();
  requirePermission(tenant, "business.manage");
  if (tenant.business.platform !== "sensitive") redirect("/app");
  const today = todayIn(tenant.business.timezone);
  const stops = tenant.business.travel ?? [];
  return (
    <>
      <PageHeader eyebrow={t("Business")} title={t("Travel mode")} description={t("Add the cities and dates where you'll be working. Your page shows them and your assistant books customers there. Block the hours you travel with «Not available» in Bookings.")} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <CardHeader title={t("New trip")} />
          <ActionForm action={addTravelStop} className="space-y-3 p-5" resetOnSuccess>
            <Field label={t("City")}><Input name="city" required maxLength={80} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("From")}><Input name="from" type="date" min={today} required /></Field>
              <Field label={t("To")}><Input name="to" type="date" min={today} required /></Field>
            </div>
            <Field label={t("Note")} hint={t("optional, public")}><Input name="note" maxLength={120} placeholder={t("e.g. Central area")} /></Field>
            <SubmitButton icon="plus">{t("Add trip")}</SubmitButton>
          </ActionForm>
        </Card>
        <Card className="lg:col-span-2">
          {stops.length === 0 ? (
            <Empty icon="globe" title={t("No trips")}>{t("While there are no trips, customers see your usual city.")}</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {stops.map((s, i) => (
                <li key={i} className={`flex items-center gap-3 px-5 py-3 text-[14px] ${s.to < today ? "opacity-50" : ""}`}>
                  <div className="flex-1">
                    <div className="font-medium">{s.city}</div>
                    <div className="text-[13px] text-muted">{s.from} → {s.to}{s.note ? ` · ${s.note}` : ""}</div>
                  </div>
                  <form action={removeTravelStop}>
                    <input type="hidden" name="index" value={i} />
                    <ConfirmSubmit message={t("Remove this trip?")} variant="ghost" size="sm">{t("Remove")}</ConfirmSubmit>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
