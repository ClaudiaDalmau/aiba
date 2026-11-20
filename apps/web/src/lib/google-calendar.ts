import "server-only";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { decryptJson, encryptJson } from "./crypto";
import { badRequest } from "./errors";
import { audit } from "./events";
import { newId } from "./ids";
import { getSettings } from "./settings";

/**
 * Google Calendar: each business can connect one Google account.
 *  - push: every booking becomes an event in their calendar (moved / removed with the booking).
 *  - block: their own events (not AIBA's) block those times in AIBA's availability.
 * Plain REST with fetch (no SDK). Refresh token encrypted at rest; access tokens cached in memory.
 */

const SCOPES = ["openid", "email", "https://www.googleapis.com/auth/calendar.events"];
const API = "https://www.googleapis.com/calendar/v3";

export async function googleConfigured() {
  const s = await getSettings();
  return Boolean(s["google.clientId"] && s["google.clientSecret"]);
}

async function creds() {
  const s = await getSettings();
  const clientId = String(s["google.clientId"] ?? "");
  const clientSecret = String(s["google.clientSecret"] ?? "");
  if (!clientId || !clientSecret) throw badRequest("Google Calendar isn't set up on this platform yet.");
  return { clientId, clientSecret, redirectUri: `${s["general.appUrl"]}/api/integrations/google/callback` };
}

export async function authUrl(businessId: string, userId: string) {
  const { clientId, redirectUri } = await creds();
  const state = encryptJson({ b: businessId, u: userId, exp: Date.now() + 15 * 60_000 });
  const q = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

export function readState(state: string): { b: string; u: string } {
  const s = decryptJson<{ b: string; u: string; exp: number }>(state);
  if (!s?.b || s.exp < Date.now()) throw badRequest("This link has expired. Try connecting again.");
  return s;
}

export async function connectFromCode(businessId: string, userId: string, code: string) {
  const { clientId, clientSecret, redirectUri } = await creds();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  const tok = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; id_token?: string; scope?: string; error?: string };
  if (!res.ok || !tok.refresh_token) throw badRequest("Google didn't grant access. Try again and accept the calendar permission.");
  if (!tok.scope?.includes("calendar.events")) throw badRequest("Calendar permission was not granted. Try again and tick the calendar box.");
  let email = "";
  try {
    email = JSON.parse(Buffer.from((tok.id_token ?? "").split(".")[1] ?? "", "base64url").toString()).email ?? "";
  } catch {}
  const values = { accountEmail: email, refreshToken: encryptJson(tok.refresh_token), lastError: null, createdBy: userId };
  const [existing] = await db.select({ id: schema.calendarConnections.id }).from(schema.calendarConnections).where(and(eq(schema.calendarConnections.businessId, businessId), eq(schema.calendarConnections.provider, "google")));
  if (existing) await db.update(schema.calendarConnections).set(values).where(eq(schema.calendarConnections.id, existing.id));
  else await db.insert(schema.calendarConnections).values({ id: newId("cal"), businessId, provider: "google", ...values });
  tokens.delete(businessId);
  if (tok.access_token) tokens.set(businessId, { token: tok.access_token, exp: Date.now() + ((tok.expires_in ?? 3600) - 60) * 1000 });
  await audit(businessId, { type: "user", id: userId }, "calendar.connected", businessId, { email });
}

export async function getConnection(businessId: string) {
  const [c] = await db.select().from(schema.calendarConnections).where(and(eq(schema.calendarConnections.businessId, businessId), eq(schema.calendarConnections.provider, "google")));
  return c ?? null;
}

export async function updateConnection(businessId: string, patch: { pushBookings: boolean; blockBusy: boolean; staffId: string | null }) {
  await db.update(schema.calendarConnections).set(patch).where(eq(schema.calendarConnections.businessId, businessId));
}

export async function disconnect(businessId: string, userId: string) {
  const c = await getConnection(businessId);
  if (!c) return;
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(decryptJson<string>(c.refreshToken))}`, { method: "POST" });
  } catch {}
  await db.delete(schema.calendarConnections).where(eq(schema.calendarConnections.id, c.id));
  await db.update(schema.bookings).set({ googleEventId: null }).where(eq(schema.bookings.businessId, businessId));
  tokens.delete(businessId);
  await audit(businessId, { type: "user", id: userId }, "calendar.disconnected", businessId);
}

const tokens = new Map<string, { token: string; exp: number }>();

async function accessToken(c: schema.CalendarConnection) {
  const hit = tokens.get(c.businessId);
  if (hit && hit.exp > Date.now()) return hit.token;
  const { clientId, clientSecret } = await creds();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: decryptJson<string>(c.refreshToken), grant_type: "refresh_token" }),
  });
  const tok = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !tok.access_token) {
    await db.update(schema.calendarConnections).set({ lastError: tok.error === "invalid_grant" ? "access_revoked" : `token_${res.status}` }).where(eq(schema.calendarConnections.id, c.id));
    throw new Error(`google token: ${tok.error ?? res.status}`);
  }
  tokens.set(c.businessId, { token: tok.access_token, exp: Date.now() + ((tok.expires_in ?? 3600) - 60) * 1000 });
  return tok.access_token;
}

async function gapi(c: schema.CalendarConnection, path: string, init: RequestInit = {}) {
  const token = await accessToken(c);
  const res = await fetch(`${API}${path}`, { ...init, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) } });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(`google ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data;
}

/** Create, move or remove the Google event of a booking. Best-effort: never throws. */
export async function syncBookingToGoogle(bookingId: string) {
  try {
    const [row] = await db
      .select({ b: schema.bookings, s: schema.services, c: schema.customers, st: schema.staff, biz: schema.businesses })
      .from(schema.bookings)
      .innerJoin(schema.services, eq(schema.services.id, schema.bookings.serviceId))
      .innerJoin(schema.customers, eq(schema.customers.id, schema.bookings.customerId))
      .innerJoin(schema.staff, eq(schema.staff.id, schema.bookings.staffId))
      .innerJoin(schema.businesses, eq(schema.businesses.id, schema.bookings.businessId))
      .where(eq(schema.bookings.id, bookingId));
    if (!row) return;
    const conn = await getConnection(row.b.businessId);
    if (!conn?.pushBookings) return;
    const { b, s, c, st, biz } = row;
    const cal = encodeURIComponent(conn.calendarId);
    if (b.status === "cancelled") {
      if (b.googleEventId) {
        await gapi(conn, `/calendars/${cal}/events/${encodeURIComponent(b.googleEventId)}`, { method: "DELETE" }).catch((e) => {
          if ((e as { status?: number }).status !== 404 && (e as { status?: number }).status !== 410) throw e;
        });
        await db.update(schema.bookings).set({ googleEventId: null }).where(eq(schema.bookings.id, b.id));
      }
      return;
    }
    const settings = await getSettings();
    const end = new Date(b.startsAt.getTime() + s.durationMinutes * 60_000);
    const event = {
      summary: `${b.status === "pending" ? "⏳ " : ""}${s.name} · ${c.name}`,
      description: [
        `${st.name}`,
        c.phone ? `📞 ${c.phone}` : "",
        c.email ? `✉️ ${c.email}` : "",
        b.notes ? `📝 ${b.notes}` : "",
        `${settings["general.appUrl"]}/app/bookings?focus=${b.id}`,
      ]
        .filter(Boolean)
        .join("\n"),
      start: { dateTime: b.startsAt.toISOString(), timeZone: biz.timezone },
      end: { dateTime: end.toISOString(), timeZone: biz.timezone },
      extendedProperties: { private: { aibaBookingId: b.id } },
      reminders: { useDefault: true },
    };
    if (b.googleEventId) {
      try {
        await gapi(conn, `/calendars/${cal}/events/${encodeURIComponent(b.googleEventId)}`, { method: "PATCH", body: JSON.stringify(event) });
        return;
      } catch (e) {
        if ((e as { status?: number }).status !== 404 && (e as { status?: number }).status !== 410) throw e;
      }
    }
    const created = (await gapi(conn, `/calendars/${cal}/events`, { method: "POST", body: JSON.stringify(event) })) as { id: string };
    await db.update(schema.bookings).set({ googleEventId: created.id }).where(eq(schema.bookings.id, b.id));
    if (conn.lastError) await db.update(schema.calendarConnections).set({ lastError: null }).where(eq(schema.calendarConnections.id, conn.id));
  } catch (e) {
    console.error("google sync", bookingId, e);
  }
}

type Busy = { staffId: string | null; start: number; end: number };
const busyCache = new Map<string, { at: number; value: Busy[] }>();

/** The business's own Google events in [from, to) — excluding the ones AIBA created. Cached 60 s. Never throws. */
export async function googleBusy(businessId: string, from: Date, to: Date, tz: string): Promise<Busy[]> {
  const key = `${businessId}|${from.toISOString()}`;
  const hit = busyCache.get(key);
  if (hit && Date.now() - hit.at < 60_000) return hit.value;
  try {
    const conn = await getConnection(businessId);
    if (!conn?.blockBusy) return [];
    const q = new URLSearchParams({ timeMin: from.toISOString(), timeMax: to.toISOString(), singleEvents: "true", maxResults: "250", timeZone: tz });
    const data = (await gapi(conn, `/calendars/${encodeURIComponent(conn.calendarId)}/events?${q}`)) as {
      items?: { status?: string; transparency?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; extendedProperties?: { private?: Record<string, string> } }[];
    };
    const out: Busy[] = [];
    for (const ev of data?.items ?? []) {
      if (ev.status === "cancelled" || ev.transparency === "transparent" || ev.extendedProperties?.private?.aibaBookingId) continue;
      // All-day events (e.g. holidays) block the whole requested window — callers ask for one day at a time.
      const start = ev.start?.dateTime ? Date.parse(ev.start.dateTime) : ev.start?.date ? from.getTime() : NaN;
      const end = ev.end?.dateTime ? Date.parse(ev.end.dateTime) : ev.end?.date ? to.getTime() : NaN;
      if (Number.isFinite(start) && Number.isFinite(end) && end > start) out.push({ staffId: conn.staffId, start, end });
    }
    busyCache.set(key, { at: Date.now(), value: out });
    if (busyCache.size > 500) busyCache.clear();
    return out;
  } catch (e) {
    console.error("google busy", businessId, e);
    return [];
  }
}
