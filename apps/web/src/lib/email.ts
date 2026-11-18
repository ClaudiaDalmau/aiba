import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { INTL_LOCALE, isLocale, translate, type Locale, type T } from "@/i18n/config";
import { getDictionary } from "@/i18n/server";
import { getSettings } from "./settings";
import { formatDateTime } from "./time";

/**
 * Transactional email through Resend (https://resend.com). Without an API key nothing is sent and
 * nothing breaks: every caller treats email as best-effort, on top of the in-app/channel messages.
 */

export type Email = { to: string; subject: string; html: string; text: string; replyTo?: string };

export async function emailConfigured() {
  const s = await getSettings();
  return Boolean(s["email.enabled"] && s["email.resendApiKey"]);
}

export async function sendEmail(email: Email): Promise<boolean> {
  const s = await getSettings();
  if (!s["email.enabled"] || !s["email.resendApiKey"] || !email.to) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${s["email.resendApiKey"]}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: s["email.from"] || "AIBA <onboarding@resend.dev>",
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error("[email]", res.status, (await res.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email]", e);
    return false;
  }
}

/** Fire-and-forget wrapper: email must never make a booking or form fail. */
export function sendEmailLater(email: Email) {
  void sendEmail(email).catch((e) => console.error("[email]", e));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Minimal, client-safe HTML layout (tables + inline styles) in the business's colours. */
export function layout(opts: { brand: string; color?: string; title: string; lines: string[]; cta?: { label: string; href: string }; footer?: string }) {
  const color = /^#[0-9a-f]{6}$/i.test(opts.color ?? "") ? opts.color! : "#7c3aed";
  const body = opts.lines.map((l) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#3f3f46">${esc(l)}</p>`).join("");
  const cta = opts.cta
    ? `<p style="margin:20px 0 4px"><a href="${esc(opts.cta.href)}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:999px;font-size:15px">${esc(opts.cta.label)}</a></p>`
    : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:${color};padding:18px 24px;color:#ffffff;font-weight:700;font-size:17px">${esc(opts.brand)}</td></tr>
<tr><td style="padding:28px 24px 24px"><h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;color:#0b1220">${esc(opts.title)}</h1>${body}${cta}</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #f4f4f5;font-size:12px;color:#a1a1aa">${esc(opts.footer ?? "Sent with AIBA")}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [opts.title, "", ...opts.lines, ...(opts.cta ? ["", `${opts.cta.label}: ${opts.cta.href}`] : [])].join("\n");
  return { html, text };
}

/** Translator for an email written in the business's language (not the request's). */
export function translatorFor(locale: string): { t: T; locale: Locale; intl: string } {
  const l: Locale = isLocale(locale) ? locale : "en";
  const dict = getDictionary(l);
  return { t: (s, v) => translate(dict, s, v), locale: l, intl: INTL_LOCALE[l] };
}

export type BookingEmailKind = "confirmed" | "requested" | "rescheduled" | "cancelled" | "reminder";

/** Email the customer about their booking, in the business's language, if they left an address. */
export async function emailCustomerAboutBooking(bookingId: string, kind: BookingEmailKind, extra: { reason?: string } = {}) {
  if (!(await emailConfigured())) return false;
  const [row] = await db
    .select({ booking: schema.bookings, business: schema.businesses, service: schema.services, staff: schema.staff, customer: schema.customers })
    .from(schema.bookings)
    .innerJoin(schema.businesses, eq(schema.businesses.id, schema.bookings.businessId))
    .innerJoin(schema.services, eq(schema.services.id, schema.bookings.serviceId))
    .innerJoin(schema.staff, eq(schema.staff.id, schema.bookings.staffId))
    .innerJoin(schema.customers, eq(schema.customers.id, schema.bookings.customerId))
    .where(eq(schema.bookings.id, bookingId));
  if (!row?.customer.email || row.customer.erasedAt) return false;
  const { booking, business, service, staff, customer } = row;
  const { t, intl } = translatorFor(business.locale);
  const settings = await getSettings();
  const when = formatDateTime(booking.startsAt, business.timezone, intl);
  const manage = `${settings["general.appUrl"]}/manage/${booking.manageToken}`;
  const first = customer.name.split(" ")[0] || customer.name;
  const titles: Record<BookingEmailKind, string> = {
    confirmed: t("Your booking is confirmed"),
    requested: t("We've received your booking request"),
    rescheduled: t("Your booking has been moved"),
    cancelled: t("Your booking has been cancelled"),
    reminder: t("Reminder of your appointment"),
  };
  const lines = [
    t("Hi {name},", { name: first }),
    kind === "requested"
      ? t("{business} will confirm your request shortly.", { business: business.name })
      : kind === "cancelled"
        ? t("Your appointment at {business} has been cancelled.", { business: business.name })
        : t("Here are the details of your appointment at {business}.", { business: business.name }),
    `${t("Service")}: ${service.name}`,
    `${t("When")}: ${when}`,
    `${t("With")}: ${staff.name}`,
    ...(extra.reason ? [`${t("Reason")}: ${extra.reason}`] : []),
    ...(kind !== "cancelled" && business.policy.cancellationWindowHours
      ? [t("Free cancellation up to {h}h before.", { h: business.policy.cancellationWindowHours })]
      : []),
  ];
  const { html, text } = layout({
    brand: business.name,
    color: business.brandColor,
    title: titles[kind],
    lines,
    cta: kind === "cancelled" ? { label: t("Book again"), href: `${settings["general.appUrl"]}/b/${business.slug}` } : { label: t("Manage booking"), href: manage },
    footer: t("Sent by {business} with AIBA", { business: business.name }),
  });
  return sendEmail({ to: customer.email ?? "", subject: `${titles[kind]} · ${business.name}`, html, text, replyTo: business.email || undefined });
}

/** Tell the business by email about a new booking (in addition to push and in-app notifications). */
export async function emailBusinessNewBooking(bookingId: string) {
  if (!(await emailConfigured())) return false;
  const [row] = await db
    .select({ booking: schema.bookings, business: schema.businesses, service: schema.services, staff: schema.staff, customer: schema.customers })
    .from(schema.bookings)
    .innerJoin(schema.businesses, eq(schema.businesses.id, schema.bookings.businessId))
    .innerJoin(schema.services, eq(schema.services.id, schema.bookings.serviceId))
    .innerJoin(schema.staff, eq(schema.staff.id, schema.bookings.staffId))
    .innerJoin(schema.customers, eq(schema.customers.id, schema.bookings.customerId))
    .where(eq(schema.bookings.id, bookingId));
  if (!row?.business.email) return false;
  const { booking, business, service, staff, customer } = row;
  const { t, intl } = translatorFor(business.locale);
  const settings = await getSettings();
  const pending = booking.status === "pending";
  const title = pending ? t("New booking request: {service}", { service: service.name }) : t("New booking: {service}", { service: service.name });
  const { html, text } = layout({
    brand: "AIBA",
    title,
    lines: [
      `${t("Customer")}: ${customer.name}${customer.phone ? ` · ${customer.phone}` : ""}${customer.email ? ` · ${customer.email}` : ""}`,
      `${t("When")}: ${formatDateTime(booking.startsAt, business.timezone, intl)}`,
      `${t("With")}: ${staff.name}`,
      ...(pending ? [t("Confirm or decline it from your workspace.")] : []),
    ],
    cta: { label: t("Open in AIBA"), href: `${settings["general.appUrl"]}/app/bookings?focus=${booking.id}` },
  });
  return sendEmail({ to: business.email, subject: title, html, text });
}

/** Alert the platform team about a new lead from the public website. */
export async function emailTeamNewLead(lead: schema.Lead) {
  const s = await getSettings();
  const to = s["email.teamInbox"] || s["general.supportEmail"] || "";
  if (!to) return false;
  const kind = lead.kind === "access_request" ? "Access request (Sensible)" : "Waitlist sign-up";
  const { html, text } = layout({
    brand: "AIBA",
    title: `${kind}: ${lead.name || lead.email}`,
    lines: [
      `Email: ${lead.email}`,
      ...(lead.phone ? [`Phone: ${lead.phone}`] : []),
      ...(lead.businessName ? [`Business: ${lead.businessName}`] : []),
      ...(lead.category ? [`Category: ${lead.category}`] : []),
      ...(lead.website ? [`Website: ${lead.website}`] : []),
      ...(lead.links.length ? [`Links: ${lead.links.join(" · ")}`] : []),
      ...(lead.message ? [lead.message] : []),
      `Source: ${lead.source || "website"} · ${lead.locale || "—"}`,
    ],
    cta: { label: "Open leads", href: `${s["general.appUrl"]}/admin/leads` },
  });
  return sendEmail({ to, subject: `[AIBA] ${kind}: ${lead.name || lead.email}`, html, text, replyTo: lead.email });
}
