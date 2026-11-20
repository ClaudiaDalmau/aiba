import { exportCustomersCsv } from "@/lib/customers-io";
import { audit } from "@/lib/events";
import { currentTenant, requirePermission } from "@/lib/tenant";

export async function GET() {
  const tenant = await currentTenant();
  requirePermission(tenant, "customers.manage");
  const csv = await exportCustomersCsv(tenant.business.id);
  await audit(tenant.business.id, { type: "user", id: tenant.user.id }, "customers.exported", tenant.business.id);
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="customers-${tenant.business.slug}.csv"` } });
}
