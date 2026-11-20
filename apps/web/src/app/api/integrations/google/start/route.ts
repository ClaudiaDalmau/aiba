import { authUrl } from "@/lib/google-calendar";
import { getSettings } from "@/lib/settings";
import { currentTenant, requirePermission } from "@/lib/tenant";

export async function GET(req: Request) {
  const tenant = await currentTenant();
  requirePermission(tenant, "business.manage");
  try {
    return Response.redirect(await authUrl(tenant.business.id, tenant.user.id), 302);
  } catch {
    const base = String((await getSettings())["general.appUrl"] || new URL(req.url).origin);
    return Response.redirect(`${base}/app/settings?google=unavailable#calendar`, 302);
  }
}
