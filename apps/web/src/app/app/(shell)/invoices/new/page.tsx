import { getT } from "@/i18n/server";
import { redirect } from "next/navigation";
import { issueInvoiceAction } from "@/actions/invoices";
import { SubmitButton, Toggle } from "@/components/client";
import { Card, CardHeader, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/workspace/action-form";
import { InvoiceLines } from "@/components/workspace/invoice-lines";
import { requestIntlLocale } from "@/i18n/request-locale";
import { draftFrom, fiscalComplete } from "@/lib/invoices";
import { currentTenant, requirePermission } from "@/lib/tenant";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("New invoice") };
}

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ booking?: string; pack?: string }> }) {
  const t = await getT();
  const tenant = await currentTenant();
  requirePermission(tenant, "business.manage");
  const b = tenant.business;
  if (!fiscalComplete(b.fiscal ?? {})) redirect("/app/invoices");
  const sp = await searchParams;
  const draft = await draftFrom(b, { bookingId: sp.booking, packId: sp.pack });
  const rate = b.fiscal?.taxRate ?? 0;
  const initial = (draft?.lines ?? []).map((l) => ({ description: l.description, quantity: l.quantity, price: (l.unitPriceCents / 100).toFixed(2), tax: l.taxRate }));
  if (!initial.length) initial.push({ description: "", quantity: 1, price: "", tax: rate });
  return (
    <>
      <PageHeader eyebrow={t("Invoices")} title={t("New invoice")} description={t("The number is assigned when you issue it. Issued invoices can't be edited, only cancelled.")} />
      <ActionForm action={issueInvoiceAction} className="grid gap-6 lg:grid-cols-3">
        <input type="hidden" name="customerId" value={draft?.customerId ?? ""} />
        <input type="hidden" name="bookingId" value={(draft && "bookingId" in draft && draft.bookingId) || ""} />
        <input type="hidden" name="customerPackId" value={(draft && "customerPackId" in draft && draft.customerPackId) || ""} />
        <Card className="h-fit">
          <CardHeader title={t("Billed to")} />
          <div className="space-y-3 p-5">
            <Field label={t("Name")}><Input name="buyerName" defaultValue={draft?.buyer.name} required /></Field>
            <Field label={t("Tax ID")} hint={t("optional")}><Input name="buyerTaxId" /></Field>
            <Field label={t("Address")} hint={t("optional")}><Input name="buyerAddress" /></Field>
            <Field label={t("Email")} hint={t("optional")}><Input name="buyerEmail" type="email" defaultValue={draft?.buyer.email} /></Field>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title={t("Lines")} description={rate ? t("Customer prices usually include tax, so the suggested amount is shown before tax ({rate}%).", { rate }) : undefined} />
          <div className="space-y-5 p-5">
            <InvoiceLines initial={initial} currency={b.currency} locale={requestIntlLocale()} />
            <Field label={t("Notes")} hint={t("optional")}><Textarea name="notes" rows={2} /></Field>
            <Toggle name="paid" defaultChecked label={t("Already paid")} description={t("Mark it as paid when you issue it.")} />
            <Field label={t("Payment method")} hint={t("optional")}><Input name="paymentMethod" placeholder={t("Cash, card, transfer, Bizum…")} /></Field>
            <SubmitButton icon="file">{t("Issue invoice")}</SubmitButton>
          </div>
        </Card>
      </ActionForm>
    </>
  );
}
