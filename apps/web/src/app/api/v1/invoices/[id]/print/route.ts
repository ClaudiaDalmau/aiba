import { invoiceHtml } from "@/lib/invoice-render";
import { getInvoice } from "@/lib/invoices";
import { currentTenant, requirePermission } from "@/lib/tenant";

/** Printable invoice (browser «Save as PDF»). Opens the print dialog automatically. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const tenant = await currentTenant();
  requirePermission(tenant, "business.manage");
  const { id } = await ctx.params;
  const inv = await getInvoice(tenant.business.id, id);
  const html = invoiceHtml(inv, tenant.business, { full: true }).replace("</body>", "<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300))</script></body>");
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
