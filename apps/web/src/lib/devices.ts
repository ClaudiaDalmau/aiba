import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { sha256 } from "./crypto";
import { translatorFor, sendEmail, layout } from "./email";
import { getSettings } from "./settings";

/** Device label from the user agent, e.g. "Safari on iPhone". Coarse on purpose (no fingerprinting). */
export function deviceLabel(ua: string) {
  const os = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  const br = /Edg\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /AIBA|okhttp|Expo/i.test(ua) ? "AIBA app" : "";
  return [br, os].filter(Boolean).join(" · ") || "Unknown device";
}

/**
 * Remember the device a user signs in from; if it's new (and not her first ever), email her a
 * «new sign-in» alert with a link to sign out other devices. Never throws.
 */
export async function noteSignIn(user: Pick<schema.User, "id" | "email" | "name">, ua: string, sessionId?: string) {
  try {
    const label = deviceLabel(ua);
    const hash = sha256(`${label}|${ua.replace(/[\d.]+/g, "")}`).slice(0, 32);
    if (sessionId) await db.update(schema.sessions).set({ device: label, deviceHash: hash }).where(eq(schema.sessions.id, sessionId));
    const known = await db.select({ h: schema.knownDevices.deviceHash }).from(schema.knownDevices).where(eq(schema.knownDevices.userId, user.id));
    if (known.some((k) => k.h === hash)) {
      await db.update(schema.knownDevices).set({ lastSeenAt: new Date() }).where(and(eq(schema.knownDevices.userId, user.id), eq(schema.knownDevices.deviceHash, hash)));
      return;
    }
    await db.insert(schema.knownDevices).values({ userId: user.id, deviceHash: hash, label }).onConflictDoNothing();
    if (!known.length) return; // first device: nothing to warn about
    const s = await getSettings();
    const { requestLocale } = await import("@/i18n/request-locale");
    const { t } = translatorFor(requestLocale());
    const url = `${s["general.appUrl"]}/account/security`;
    const when = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
    const { html, text } = layout({
      brand: "AIBA",
      color: "#7c3aed",
      title: t("New sign-in to your account"),
      lines: [t("Hi {name},", { name: user.name.split(" ")[0] || user.name }), t("Your AIBA account was just opened on a device we hadn't seen before:"), `${label} · ${when}`, t("If it was you, you don't need to do anything. If not, sign out the other devices now and change your password.")],
      cta: { label: t("Review my devices"), href: url },
      footer: t("Security alert from AIBA"),
    });
    await sendEmail({ to: user.email, subject: `${t("New sign-in to your account")} · AIBA`, html, text });
  } catch (e) {
    console.error("noteSignIn", e);
  }
}

export async function activeSessions(userId: string) {
  return db
    .select({ id: schema.sessions.id, device: schema.sessions.device, kind: schema.sessions.kind, createdAt: schema.sessions.createdAt, impersonatorId: schema.sessions.impersonatorId })
    .from(schema.sessions)
    .where(and(eq(schema.sessions.userId, userId), sql`${schema.sessions.expiresAt} > now()`))
    .orderBy(sql`${schema.sessions.createdAt} desc`);
}
