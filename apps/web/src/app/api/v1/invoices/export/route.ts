import { listInvoices } from "@/lib/invoices";
import { currentTenant, requirePermission } from "@/lib/tenant";
import { zonedParts } from "@/lib/time";

/** CSV of the invoices of a year (or one quarter) for the accountant. Semicolon-separated, decimal comma: opens directly in Excel (ES/EU). */
export async function GET(req: Request) {
  const tenant = await currentTenant();
  requirePermission(tenant, "business.manage");
  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear();
  const q = Number(url.searchParams.get("q")) || 0;
  const tz = tenant.business.timezone;
  const rows = (await listInvoices(tenant.business.id, { limit: 10000 })).filter((r) => {
    if (r.year !== year) return false;
    if (!q) return true;
    return Math.floor((Number(zonedParts(r.issuedAt, tz).date.slice(5, 7)) - 1) / 3) + 1 === q;
  });
  const dec = (c: number) => (c / 100).toFixed(2).replace(".", ",");
  const cell = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const head = ["number", "date", "customer", "customer_tax_id", "base", "tax", "total", "currency", "status", "paid_on", "payment_method", "cancel_reason"];
  const lines = rows
    .slice()
    .reverse()
    .map((r) =>
      [r.number, zonedParts(r.issuedAt, tz).date, r.buyer.name, r.buyer.taxId ?? "", dec(r.subtotalCents), dec(r.taxCents), dec(r.totalCents), r.currency, r.status, r.paidAt ? zonedParts(r.paidAt, tz).date : "", r.paymentMethod, r.cancelReason]
        .map((v) => cell(String(v)))
        .join(";"),
    );
  const csv = "﻿" + [head.join(";"), ...lines].join("\r\n");
  const name = `invoices-${tenant.business.slug}-${year}${q ? `-Q${q}` : ""}.csv`;
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${name}"` } });
}
