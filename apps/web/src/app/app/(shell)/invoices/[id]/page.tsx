import { getT } from "@/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelInvoiceAction, emailInvoiceAction, markPaidAction } from "@/actions/invoices";
import { SubmitButton } from "@/components/client";
import { Badge, Card, CardHeader, Field, Input, PageHeader } from "@/components/ui";
import { ActionForm } from "@/components/workspace/action-form";
import { AppError } from "@/lib/errors";
import { invoiceHtml } from "@/lib/invoice-render";
import { getInvoice } from "@/lib/invoices";
import { currentTenant, requirePermission } from "@/lib/tenant";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();
  const tenant = await currentTenant();
  requirePermission(tenant, "business.manage");
  const { id } = await params;
  const inv = await getInvoice(tenant.business.id, id).catch((e) => {
    if (e instanceof AppError) notFound();
    throw e;
  });
  const STATUS = { issued: t("Pending payment"), paid: t("Paid"), cancelled: t("Cancelled") };
  const TONE = { issued: "warn", paid: "ok", cancelled: "bad" } as const;
  return (
    <>
      <PageHeader
        eyebrow={<Link href="/app/invoices" className="hover:underline">{t("Invoices")}</Link>}
        title={<span className="flex items-center gap-3">{inv.number} <Badge tone={TONE[inv.status]}>{STATUS[inv.status]}</Badge></span>}
        description={inv.buyer.name}
        actions={<a href={`/api/v1/invoices/${inv.id}/print`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-[14px] font-medium text-accent-fg">{t("Print / save as PDF")}</a>}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-x-auto lg:col-span-2">
          <div dangerouslySetInnerHTML={{ __html: invoiceHtml(inv, tenant.business) }} />
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title={t("Send by email")} />
            <ActionForm action={emailInvoiceAction} className="space-y-3 p-5">
              <input type="hidden" name="id" value={inv.id} />
              <Field label={t("Email")}><Input name="to" type="email" defaultValue={inv.buyer.email} required /></Field>
              <SubmitButton variant="secondary" icon="send">{t("Send invoice")}</SubmitButton>
            </ActionForm>
          </Card>
          {inv.status === "issued" && (
            <Card>
              <CardHeader title={t("Mark as paid")} />
              <ActionForm action={markPaidAction} className="space-y-3 p-5">
                <input type="hidden" name="id" value={inv.id} />
                <Field label={t("Payment method")} hint={t("optional")}><Input name="method" placeholder={t("Cash, card, transfer, Bizum…")} /></Field>
                <SubmitButton variant="secondary" icon="check">{t("Mark as paid")}</SubmitButton>
              </ActionForm>
            </Card>
          )}
          {inv.status !== "cancelled" && (
            <Card className="border-bad/20">
              <CardHeader title={t("Cancel invoice")} description={t("The number stays used and the invoice is kept as cancelled. To correct it, cancel it and issue a new one.")} />
              <ActionForm action={cancelInvoiceAction} className="space-y-3 p-5">
                <input type="hidden" name="id" value={inv.id} />
                <Field label={t("Reason")}><Input name="reason" required /></Field>
                <SubmitButton variant="danger">{t("Cancel invoice")}</SubmitButton>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
