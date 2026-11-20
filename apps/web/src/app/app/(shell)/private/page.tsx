import { getT } from "@/i18n/server";
import { redirect } from "next/navigation";
import { savePrivateProfile } from "@/actions/sensitive";
import { SubmitButton } from "@/components/client";
import { Card, CardHeader, Field, PageHeader, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/workspace/action-form";
import { readPrivateProfile } from "@/lib/sensitive";
import { currentTenant, requirePermission } from "@/lib/tenant";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Private sheet") };
}

export default async function PrivateSheet() {
  const t = await getT();
  const tenant = await currentTenant();
  requirePermission(tenant, "business.manage");
  if (tenant.business.platform !== "sensitive") redirect("/app");
  const p = readPrivateProfile(tenant.business);
  return (
    <>
      <PageHeader eyebrow={t("Business")} title={t("Private sheet")} description={t("Your own notes about what you offer, your rates and your limits. Encrypted, visible only to you. The assistant never reads it and it never appears on your page.")} />
      <Card className="max-w-3xl">
        <CardHeader title={t("Only for you")} />
        <ActionForm action={savePrivateProfile} className="space-y-4 p-5">
          <Field label={t("What I offer")}><Textarea name="services" rows={5} defaultValue={p.services} /></Field>
          <Field label={t("Rates and extras")}><Textarea name="rates" rows={3} defaultValue={p.rates} /></Field>
          <Field label={t("My limits")} hint={t("what I never do")}><Textarea name="boundaries" rows={3} defaultValue={p.boundaries} /></Field>
          <Field label={t("Notes")}><Textarea name="notes" rows={4} defaultValue={p.notes} /></Field>
          <SubmitButton icon="shield">{t("Save")}</SubmitButton>
        </ActionForm>
      </Card>
      <p className="mt-4 max-w-3xl text-[13px] text-muted">{t("For the assistant, name your appointment types neutrally in Services (e.g. «Appointment 1 h», «Appointment 2 h»): it gives customers only those names, durations and prices.")}</p>
    </>
  );
}
