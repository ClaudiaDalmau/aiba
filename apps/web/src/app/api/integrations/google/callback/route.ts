import { connectFromCode, readState } from "@/lib/google-calendar";
import { getSettings } from "@/lib/settings";

/** Google redirects here after the owner accepts (or refuses) calendar access. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = String((await getSettings())["general.appUrl"] || url.origin);
  const back = (status: string) => Response.redirect(`${base}/app/settings?google=${status}#calendar`, 302);
  if (url.searchParams.get("error")) return back("denied");
  try {
    const { b, u } = readState(url.searchParams.get("state") ?? "");
    await connectFromCode(b, u, url.searchParams.get("code") ?? "");
    return back("connected");
  } catch (e) {
    console.error("google callback", e);
    return back("error");
  }
}
