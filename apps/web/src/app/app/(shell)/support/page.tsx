import { getT } from "@/i18n/server";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { HelpRequestForm } from "@/components/help-request";
import { currentTenant } from "@/lib/tenant";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Support") };
}

/** Neutral-looking support page; on Sensible it doubles as the confidential help channel. */
export default async function SupportPage() {
  const t = await getT();
  const tenant = await currentTenant();
  const sensitive = tenant.business.platform === "sensitive";
  return (
    <>
      <PageHeader title={t("Support")} description={t("Write to the AIBA team.")} />
      <Card className="max-w-2xl">
        <CardHeader
          title={sensitive ? t("Confidential help") : t("Contact support")}
          description={
            sensitive
              ? t("If someone is controlling your work, your phone or your money, or you feel unsafe, tell us here. Only the AIBA safety team sees it: nothing appears in your account, your inbox or your activity, and nobody with access to your profile is notified.")
              : t("Questions, problems or ideas: we'll answer by email.")
          }
        />
        <div className="p-5"><HelpRequestForm /></div>
      </Card>
      {sensitive && <p className="mt-4 max-w-2xl text-[13px] text-muted">{t("If you are in immediate danger, call the emergency number of your country (112 in the EU).")}</p>}
    </>
  );
}
