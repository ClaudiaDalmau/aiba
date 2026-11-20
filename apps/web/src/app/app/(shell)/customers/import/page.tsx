import { getT } from "@/i18n/server";
import Link from "next/link";
import { importCustomersAction } from "@/actions/customers-io";
import { SubmitButton } from "@/components/client";
import { Card, CardHeader, PageHeader } from "@/components/ui";
import { ActionForm } from "@/components/workspace/action-form";
import { currentTenant, requirePermission } from "@/lib/tenant";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Import customers") };
}

export default async function ImportCustomersPage() {
  const t = await getT();
  const tenant = await currentTenant();
  requirePermission(tenant, "customers.manage");
  return (
    <>
      <PageHeader eyebrow={<Link href="/app/customers" className="hover:underline">{t("Customers")}</Link>} title={t("Import customers")} description={t("Bring your customer list from another app, Excel or your phone's contacts.")} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("Upload a CSV file")} />
          <ActionForm action={importCustomersAction} className="space-y-4 p-5" resetOnSuccess>
            <input type="file" name="file" accept=".csv,text/csv,text/plain" required className="block w-full text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-1.5 file:text-[13px]" />
            <SubmitButton icon="users">{t("Import")}</SubmitButton>
          </ActionForm>
        </Card>
        <Card>
          <CardHeader title={t("How the file should look")} />
          <div className="space-y-3 p-5 text-[14px] text-muted">
            <p>{t("First row with the column names; one customer per row. Columns are recognised in any language: name (or first name + last name), email, phone, notes.")}</p>
            <pre className="overflow-x-auto rounded-lg bg-subtle p-3 text-[12px] text-fg">name;email;phone;notes{"\n"}Ana García;ana@mail.com;+34600111222;Prefers mornings{"\n"}Luis Pérez;;612345678;</pre>
            <p>{t("Each customer needs an email or a phone. Existing customers (same email or phone) aren't duplicated. Excel: File → Save as → CSV.")}</p>
            <p>{t("Only import people who agreed to you keeping their details.")}</p>
          </div>
        </Card>
      </div>
    </>
  );
}
