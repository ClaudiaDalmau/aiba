import { getT } from "@/i18n/server";
import Link from "next/link";
import { saveFiscalAction } from "@/actions/invoices";
import { SubmitButton } from "@/components/client";
import { Badge, Card, CardHeader, Empty, Field, Input, LinkButton, PageHeader, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/workspace/action-form";
import { fiscalComplete, listInvoices, quarterSummary } from "@/lib/invoices";
import { currentTenant, requirePermission } from "@/lib/tenant";
import { formatDate, formatMoney, zonedParts } from "@/lib/time";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Invoices") };
}

const INVOICE_TONE = { issued: "warn", paid: "ok", cancelled: "bad" } as const;

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const t = await getT();
  const tenant = await currentTenant();
  requirePermission(tenant, "business.manage");
  const b = tenant.business;
  const thisYear = Number(zonedParts(new Date(), b.timezone).date.slice(0, 4));
  const year = Number((await searchParams).year) || thisYear;
  const [rows, qs] = await Promise.all([listInvoices(b.id, { limit: 300 }), quarterSummary(b.id, year, b.timezone)]);
  const f = b.fiscal ?? {};
  const ready = fiscalComplete(f);
  const STATUS = { issued: t("Pending payment"), paid: t("Paid"), cancelled: t("Cancelled") };
  const yearTotal = qs.reduce((a, q) => ({ base: a.base + q.base, tax: a.tax + q.tax, total: a.total + q.total, unpaid: a.unpaid + q.unpaid }), { base: 0, tax: 0, total: 0, unpaid: 0 });
  const money = (c: number) => formatMoney(c, b.currency);

  const fiscalForm = (
    <ActionForm action={saveFiscalAction} className="space-y-3 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("Legal name")}><Input name="legalName" defaultValue={f.legalName} placeholder={t("Your name or company name")} required /></Field>
        <Field label={t("Tax ID")} hint={t("NIF, VAT number…")}><Input name="taxId" defaultValue={f.taxId} required /></Field>
      </div>
      <Field label={t("Address")}><Input name="address" defaultValue={f.address} required /></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("Postal code")}><Input name="postalCode" defaultValue={f.postalCode} /></Field>
        <Field label={t("City")}><Input name="city" defaultValue={f.city} /></Field>
        <Field label={t("Country")}><Input name="country" defaultValue={f.country} /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("Invoice series")} hint={t("prefix of the number")}><Input name="series" defaultValue={f.series ?? "F"} maxLength={8} /></Field>
        <Field label={t("Default tax %")} hint={t("e.g. 21 for VAT, 0 if exempt")}><Input name="taxRate" type="number" min={0} max={100} step="0.01" defaultValue={f.taxRate ?? 21} /></Field>
      </div>
      <Field label={t("Invoice footer")} hint={t("optional")}><Textarea name="footer" rows={2} defaultValue={f.footer} placeholder={t("e.g. the legal reason if you are exempt from VAT, or your bank account for transfers")} /></Field>
      <SubmitButton>{t("Save invoicing details")}</SubmitButton>
    </ActionForm>
  );

  return (
    <>
      <PageHeader
        eyebrow={t("Business")}
        title={t("Invoices")}
        description={t("Issue numbered invoices for bookings and packs, print or email them, and see your totals by quarter.")}
        actions={ready && <LinkButton href="/app/invoices/new" icon="plus">{t("New invoice")}</LinkButton>}
      />
      {!ready ? (
        <Card className="max-w-3xl">
          <CardHeader title={t("Your invoicing details")} description={t("Needed once before your first invoice. They are printed on every invoice.")} />
          {fiscalForm}
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
              <div className="flex items-center gap-2 text-[14px]">
                <Link href={`/app/invoices?year=${year - 1}`} className="rounded-md border border-border px-2 py-1 hover:bg-subtle">‹</Link>
                <span className="font-semibold tabular-nums">{year}</span>
                {year < thisYear && <Link href={`/app/invoices?year=${year + 1}`} className="rounded-md border border-border px-2 py-1 hover:bg-subtle">›</Link>}
              </div>
              <a href={`/api/v1/invoices/export?year=${year}`} className="text-[13px] font-medium text-ai hover:underline">{t("Download {year} for my accountant (CSV)", { year })}</a>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
              {qs.map((q) => (
                <div key={q.q} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between text-[12px] font-medium uppercase tracking-wider text-faint">
                    <span>{t("Q{n}", { n: q.q })}</span>
                    {q.count > 0 && <a href={`/api/v1/invoices/export?year=${year}&q=${q.q}`} className="normal-case tracking-normal text-ai hover:underline">CSV</a>}
                  </div>
                  <div className="mt-1 text-[20px] font-semibold tabular-nums">{money(q.total)}</div>
                  <div className="text-[12px] text-muted">{t("Base {base} · tax {tax}", { base: money(q.base), tax: money(q.tax) })}</div>
                  <div className="text-[12px] text-muted">{t("{n} invoices", { n: q.count })}</div>
                </div>
              ))}
              <div className="rounded-xl bg-subtle p-4">
                <div className="text-[12px] font-medium uppercase tracking-wider text-faint">{t("Year")}</div>
                <div className="mt-1 text-[20px] font-semibold tabular-nums">{money(yearTotal.total)}</div>
                <div className="text-[12px] text-muted">{t("Base {base} · tax {tax}", { base: money(yearTotal.base), tax: money(yearTotal.tax) })}</div>
                {yearTotal.unpaid > 0 && <div className="text-[12px] font-medium text-warn">{t("Pending: {amount}", { amount: money(yearTotal.unpaid) })}</div>}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={t("Issued invoices")} />
            {rows.length === 0 ? (
              <Empty icon="file" title={t("No invoices yet")}>{t("Create one with «New invoice», or from a booking or a sold pack.")}</Empty>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((r) => (
                  <li key={r.id}>
                    <Link href={`/app/invoices/${r.id}`} className="flex items-center gap-3 px-5 py-3 text-[14px] hover:bg-subtle/60">
                      <span className="w-28 shrink-0 font-mono text-[13px]">{r.number}</span>
                      <span className="min-w-0 flex-1 truncate">{r.buyer.name}</span>
                      <span className="hidden w-28 text-[13px] text-muted sm:block">{formatDate(r.issuedAt, b.timezone, undefined, { weekday: undefined, year: "numeric" })}</span>
                      <span className={r.status === "cancelled" ? "w-24 text-right tabular-nums text-faint line-through" : "w-24 text-right font-medium tabular-nums"}>{money(r.totalCents)}</span>
                      <Badge tone={INVOICE_TONE[r.status]}>{STATUS[r.status]}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <details>
              <summary className="cursor-pointer list-none px-5 py-4 text-[14px] font-medium">{t("Your invoicing details")} <span className="font-normal text-muted">· {f.legalName} · {f.taxId}</span></summary>
              {fiscalForm}
            </details>
          </Card>
        </div>
      )}
    </>
  );
}
