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

export type BookingEmailKind = "confirmed" | "requested" | "rescheduled" | "cancelled" | "reminder" | "review";

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
    review: t("How was your visit?"),
  };
  const lines = [
    t("Hi {name},", { name: first }),
    kind === "review"
      ? t("Thanks for visiting {business}. Would you rate your experience? It takes 30 seconds and helps others choose.", { business: business.name })
      : kind === "requested"
      ? t("{business} will confirm your request shortly.", { business: business.name })
      : kind === "cancelled"
        ? t("Your appointment at {business} has been cancelled.", { business: business.name })
        : t("Here are the details of your appointment at {business}.", { business: business.name }),
    `${t("Service")}: ${service.name}`,
    `${t("When")}: ${when}`,
    `${t("With")}: ${staff.name}`,
    ...(extra.reason ? [`${t("Reason")}: ${extra.reason}`] : []),
    ...(kind !== "cancelled" && kind !== "review" && business.policy.cancellationWindowHours
      ? [t("Free cancellation up to {h}h before.", { h: business.policy.cancellationWindowHours })]
      : []),
  ];
  const { html, text } = layout({
    brand: business.name,
    color: business.brandColor,
    title: titles[kind],
    lines,
    cta:
      kind === "cancelled"
        ? { label: t("Book again"), href: `${settings["general.appUrl"]}/b/${business.slug}` }
        : kind === "review"
          ? { label: t("Leave a review"), href: `${manage}#review` }
          : { label: t("Manage booking"), href: manage },
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

/** Sensible manual review: tell the applicant they're on the waitlist (their language). */
export async function emailApplicantWaitlisted(to: string, name: string, locale: string) {
  if (!to) return false;
  const { t } = translatorFor(locale);
  const title = t("You're on the waitlist");
  const { html, text } = layout({
    brand: "AIBA",
    title,
    lines: [
      name ? t("Hi {name},", { name: name.split(" ")[0] || name }) : t("Hello,"),
      t("Thanks for your request to join AIBA. Places are limited, so for now you're on the waitlist."),
      t("Our team reviews every request by hand. We'll write to you at this address as soon as there's an answer."),
    ],
    footer: t("Sent by AIBA"),
  });
  return sendEmail({ to, subject: `AIBA · ${title}`, html, text });
}

/** Sensible manual review: alert the platform team that someone on the review list applied. */
export async function emailTeamReviewMatch(opts: { what: "Access request" | "New Sensible profile"; name: string; email: string; phone?: string; matched: string; href: string }) {
  const s = await getSettings();
  const to = s["email.teamInbox"] || s["general.supportEmail"] || "";
  if (!to) return false;
  const title = `⚠ Manual review · ${opts.what}: ${opts.name || opts.email}`;
  const { html, text } = layout({
    brand: "AIBA",
    color: "#dc2626",
    title,
    lines: [
      "This person matches your manual review list. They have been told they're on the waitlist; the request is only accepted when you do it by hand. Once they sign up, the review period applies (Sensible works normally, community titles-only).",
      `Matched: ${opts.matched}`,
      `Email: ${opts.email}`,
      ...(opts.phone ? [`Phone: ${opts.phone}`] : []),
    ],
    cta: { label: "Review now", href: `${s["general.appUrl"]}${opts.href}` },
  });
  return sendEmail({ to, subject: `[AIBA] ${title}`, html, text, replyTo: opts.email });
}

/** Review protocol started: tell the person what is limited, until when, why and how to appeal (DSA art. 17). */
export async function emailReviewPeriodStarted(to: string, name: string, locale: string, until: Date, reason: string) {
  if (!to) return false;
  const s = await getSettings();
  const { t, intl } = translatorFor(locale);
  const date = new Intl.DateTimeFormat(intl, { dateStyle: "long" }).format(until);
  const contact = s["general.supportEmail"] || s["email.teamInbox"] || "";
  const title = t("Your access to the private community is limited");
  const { html, text } = layout({
    brand: "AIBA",
    title,
    lines: [
      name ? t("Hi {name},", { name: name.split(" ")[0] || name }) : t("Hello,"),
      t("You can use the Sensible platform normally. Until {date}, in the private community you can only see the topic titles: you can't open the content, post or reply.", { date }),
      `${t("Reason")}: ${t(reason)}`,
      t("If you think this is a mistake, reply to this email or write to {contact} and a person from the team will review it.", { contact: contact || "AIBA" }),
    ],
    footer: t("Sent by AIBA"),
  });
  return sendEmail({ to, subject: `AIBA · ${title}`, html, text, ...(contact ? { replyTo: contact } : {}) });
}

/** Advance notice to the team: a review period ends soon (it then lifts on its own unless extended). */
export async function emailReviewPeriodEnding(opts: { userId: string; name: string; email: string; until: Date }) {
  const s = await getSettings();
  const to = s["email.teamInbox"] || s["general.supportEmail"] || "";
  if (!to) return false;
  const date = new Intl.DateTimeFormat("es-ES", { dateStyle: "long", timeZone: "Europe/Madrid" }).format(opts.until);
  const title = `⏰ Review period ends ${date}: ${opts.name || opts.email}`;
  const { html, text } = layout({
    brand: "AIBA",
    color: "#d97706",
    title,
    lines: [
      `The manual-review period of ${opts.name || opts.email} (${opts.email}) ends on ${date}. From then on they get full access to the private community.`,
      "If you want to keep the restriction, extend it from the user's page before that date. If you do nothing, it lifts on its own.",
    ],
    cta: { label: "Open user", href: `${s["general.appUrl"]}/admin/users/${opts.userId}` },
  });
  return sendEmail({ to, subject: `[AIBA] ${title}`, html, text });
}

/** «A slot opened up» for someone on the waitlist. */
export async function emailCustomerAboutWaitlist(business: schema.Business, customer: schema.Customer, service: string, date: string, times: string, link: string) {
  if (!(await emailConfigured()) || !customer.email || customer.erasedAt) return false;
  const { t } = translatorFor(business.locale);
  const title = t("A slot just opened up");
  const { html, text } = layout({
    brand: business.name,
    color: business.brandColor,
    title,
    lines: [
      t("Hi {name},", { name: customer.name.split(" ")[0] || customer.name }),
      t("You asked {business} to let you know if a slot freed up. Now there is one — first come, first served.", { business: business.name }),
      `${t("Service")}: ${service}`,
      `${t("When")}: ${date} · ${times}`,
    ],
    cta: { label: t("Book now"), href: link },
    footer: t("Sent by {business} with AIBA", { business: business.name }),
  });
  return sendEmail({ to: customer.email, subject: `${title} · ${business.name}`, html, text, replyTo: business.email || undefined });
}
