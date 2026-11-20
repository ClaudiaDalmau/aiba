import "server-only";
import type { schema } from "@/db";
import { translatorFor } from "./email";
import { formatDate } from "./time";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Self-contained HTML of an invoice (used for printing / PDF and in the email), in the business's language. */
export function invoiceHtml(inv: schema.Invoice, business: schema.Business, opts: { full?: boolean } = {}) {
  const { t, intl } = translatorFor(business.locale);
  const money = (c: number) => new Intl.NumberFormat(intl, { style: "currency", currency: inv.currency, minimumFractionDigits: 2 }).format(c / 100);
  const party = (p: schema.InvoiceParty) =>
    [`<strong>${esc(p.name)}</strong>`, p.taxId ? `${esc(t("Tax ID"))}: ${esc(p.taxId)}` : "", p.address ? esc(p.address) : "", p.email ? esc(p.email) : ""].filter(Boolean).join("<br>");
  const rows = inv.lines
    .map((l) => {
      const base = Math.round(l.quantity * l.unitPriceCents);
      return `<tr><td>${esc(l.description)}</td><td class="n">${l.quantity}</td><td class="n">${money(l.unitPriceCents)}</td><td class="n">${l.taxRate}%</td><td class="n">${money(base)}</td></tr>`;
    })
    .join("");
  // Tax broken down by rate.
  const byRate = new Map<number, { base: number; tax: number }>();
  for (const l of inv.lines) {
    const base = Math.round(l.quantity * l.unitPriceCents);
    const e = byRate.get(l.taxRate) ?? { base: 0, tax: 0 };
    e.base += base;
    e.tax += Math.round((base * l.taxRate) / 100);
    byRate.set(l.taxRate, e);
  }
  const taxRows = [...byRate.entries()]
    .map(([r, v]) => `<tr><td>${esc(t("Tax"))} ${r}% (${esc(t("on {amount}", { amount: money(v.base) }))})</td><td class="n">${money(v.tax)}</td></tr>`)
    .join("");
  const stamp =
    inv.status === "paid"
      ? `<div class="stamp ok">${esc(t("Paid"))}${inv.paymentMethod ? ` · ${esc(inv.paymentMethod)}` : ""}</div>`
      : inv.status === "cancelled"
        ? `<div class="stamp bad">${esc(t("Cancelled"))}${inv.cancelReason ? ` · ${esc(inv.cancelReason)}` : ""}</div>`
        : "";
  const css = `.inv{font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#0b1220;max-width:760px;margin:0 auto;padding:32px;background:#fff;font-size:13px;line-height:1.5}
.inv h1{font-size:24px;margin:0;letter-spacing:-.01em}.inv .top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:3px solid ${esc(business.brandColor || "#7c3aed")};padding-bottom:16px}
.inv .meta{text-align:right;color:#52525b}.inv .meta b{color:#0b1220}.inv .parties{display:flex;gap:32px;margin:24px 0}.inv .parties>div{flex:1}
.inv .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#a1a1aa;margin-bottom:4px}
.inv table{width:100%;border-collapse:collapse}.inv .lines th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#71717a;text-align:left;border-bottom:1px solid #e4e4e7;padding:8px 6px}
.inv .lines td{border-bottom:1px solid #f4f4f5;padding:9px 6px;vertical-align:top}.inv .n{text-align:right;white-space:nowrap}
.inv .totals{width:320px;margin:16px 0 0 auto}.inv .totals td{padding:5px 6px}.inv .totals .grand td{font-size:16px;font-weight:700;border-top:2px solid #0b1220;padding-top:9px}
.inv .notes{margin-top:28px;color:#52525b;white-space:pre-wrap}.inv .foot{margin-top:28px;padding-top:12px;border-top:1px solid #e4e4e7;color:#71717a;font-size:11.5px;white-space:pre-wrap}
.inv .stamp{display:inline-block;margin-top:8px;padding:3px 10px;border-radius:999px;font-weight:600;font-size:12px}.inv .ok{background:#dcfce7;color:#166534}.inv .bad{background:#fee2e2;color:#991b1b}`;
  const body = `<div class="inv">
<div class="top"><div><h1>${esc(t("Invoice"))}</h1>${stamp}</div><div class="meta">${esc(t("Number"))}: <b>${esc(inv.number)}</b><br>${esc(t("Date"))}: <b>${esc(formatDate(inv.issuedAt, business.timezone, intl, { weekday: undefined, day: "2-digit", month: "2-digit", year: "numeric" }))}</b></div></div>
<div class="parties"><div><div class="lbl">${esc(t("Issued by"))}</div>${party(inv.issuer)}</div><div><div class="lbl">${esc(t("Billed to"))}</div>${party(inv.buyer)}</div></div>
<table class="lines"><thead><tr><th>${esc(t("Description"))}</th><th class="n">${esc(t("Qty"))}</th><th class="n">${esc(t("Unit price"))}</th><th class="n">${esc(t("Tax"))}</th><th class="n">${esc(t("Amount"))}</th></tr></thead><tbody>${rows}</tbody></table>
<table class="totals"><tr><td>${esc(t("Subtotal"))}</td><td class="n">${money(inv.subtotalCents)}</td></tr>${taxRows}<tr class="grand"><td>${esc(t("Total"))}</td><td class="n">${money(inv.totalCents)}</td></tr></table>
${inv.notes ? `<div class="notes">${esc(inv.notes)}</div>` : ""}
${business.fiscal?.footer ? `<div class="foot">${esc(business.fiscal.footer)}</div>` : ""}
</div>`;
  return opts.full
    ? `<!doctype html><html><head><meta charset="utf-8"><title>${esc(inv.number)}</title><style>body{margin:0;background:#f4f4f5}${css}@media print{body{background:#fff}.inv{padding:0}}</style></head><body>${body}</body></html>`
    : `<style>${css}</style>${body}`;
}
