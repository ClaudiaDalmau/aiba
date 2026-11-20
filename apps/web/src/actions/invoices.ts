"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import type { ActionState } from "@/actions/workspace";
import { db, schema } from "@/db";
import { getT } from "@/i18n/server";
import { sendEmail, layout, translatorFor } from "@/lib/email";
import { AppError } from "@/lib/errors";
import { audit } from "@/lib/events";
import { invoiceHtml } from "@/lib/invoice-render";
import { cancelInvoice, getInvoice, issueInvoice, markInvoicePaid } from "@/lib/invoices";
import { tenantFor } from "@/lib/tenant";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (v: FormDataEntryValue | null) => Number(String(v ?? "").replace(",", "."));

async function run(fn: () => Promise<string>): Promise<ActionState> {
  const t = await getT();
  try {
    return { ok: true, message: t(await fn()) };
  } catch (e) {
    if (e instanceof AppError) return { error: t(e.message) };
    console.error(e);
    return { error: t("Something went wrong. Please try again.") };
  }
}

export async function saveFiscalAction(_prev: ActionState, f: FormData): Promise<ActionState> {
  const t = await tenantFor("business.manage");
  return run(async () => {
    const rate = num(f.get("taxRate"));
    const fiscal: schema.FiscalProfile = {
      legalName: s(f, "legalName").slice(0, 200),
      taxId: s(f, "taxId").slice(0, 40),
      address: s(f, "address").slice(0, 200),
      postalCode: s(f, "postalCode").slice(0, 20),
      city: s(f, "city").slice(0, 80),
      country: s(f, "country").slice(0, 80),
      series: (s(f, "series") || "F").replace(/[^A-Za-z0-9-]/g, "").slice(0, 8) || "F",
      taxRate: Number.isFinite(rate) && rate >= 0 && rate <= 100 ? rate : 0,
      footer: s(f, "footer").slice(0, 600),
    };
    await db.update(schema.businesses).set({ fiscal }).where(eq(schema.businesses.id, t.business.id));
    await audit(t.business.id, { type: "user", id: t.user.id }, "invoice.fiscal_updated", t.business.id);
    revalidatePath("/app/invoices");
    return "Invoicing details saved";
  });
}

export async function issueInvoiceAction(_prev: ActionState, f: FormData): Promise<ActionState> {
  const t = await tenantFor("business.manage");
  let id = "";
  const res = await run(async () => {
    const desc = f.getAll("lineDescription").map(String);
    const qty = f.getAll("lineQuantity");
    const price = f.getAll("linePrice");
    const tax = f.getAll("lineTax");
    const lines = desc.map((d, i) => ({ description: d, quantity: num(qty[i]), unitPriceCents: Math.round(num(price[i]) * 100), taxRate: num(tax[i]) }));
    const r = await issueInvoice(
      t.business,
      {
        buyer: { name: s(f, "buyerName"), taxId: s(f, "buyerTaxId"), address: s(f, "buyerAddress"), email: s(f, "buyerEmail") },
        lines,
        customerId: s(f, "customerId") || null,
        bookingId: s(f, "bookingId") || null,
        customerPackId: s(f, "customerPackId") || null,
        notes: s(f, "notes"),
        paid: f.get("paid") === "on",
        paymentMethod: s(f, "paymentMethod"),
      },
      t.user.id,
    );
    id = r.id;
    return "Invoice issued";
  });
  if (id) {
    revalidatePath("/app/invoices");
    redirect(`/app/invoices/${id}`);
  }
  return res;
}

export async function markPaidAction(_prev: ActionState, f: FormData): Promise<ActionState> {
  const t = await tenantFor("business.manage");
  return run(async () => {
    await markInvoicePaid(t.business.id, s(f, "id"), s(f, "method"), t.user.id);
    revalidatePath(`/app/invoices/${s(f, "id")}`);
    revalidatePath("/app/invoices");
    return "Marked as paid";
  });
}

export async function cancelInvoiceAction(_prev: ActionState, f: FormData): Promise<ActionState> {
  const t = await tenantFor("business.manage");
  return run(async () => {
    if (!s(f, "reason")) throw new AppError(400, "bad_request", "Write the reason for cancelling.");
    await cancelInvoice(t.business.id, s(f, "id"), s(f, "reason"), t.user.id);
    revalidatePath(`/app/invoices/${s(f, "id")}`);
    revalidatePath("/app/invoices");
    return "Invoice cancelled";
  });
}

export async function emailInvoiceAction(_prev: ActionState, f: FormData): Promise<ActionState> {
  const t = await tenantFor("business.manage");
  return run(async () => {
    const inv = await getInvoice(t.business.id, s(f, "id"));
    const to = s(f, "to") || inv.buyer.email || "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new AppError(400, "bad_request", "Add a valid email address.");
    const { t: bt } = translatorFor(t.business.locale);
    const intro = layout({
      brand: t.business.name,
      color: t.business.brandColor,
      title: bt("Invoice {number}", { number: inv.number }),
      lines: [bt("Hi {name},", { name: inv.buyer.name.split(" ")[0] || inv.buyer.name }), bt("Here is your invoice. Thank you!")],
    });
    const html = intro.html.replace("</body>", `<div style="padding:0 12px 24px">${invoiceHtml(inv, t.business)}</div></body>`);
    const ok = await sendEmail({ to, subject: `${bt("Invoice {number}", { number: inv.number })} · ${t.business.name}`, html, text: intro.text, replyTo: t.business.email || undefined });
    if (!ok) throw new AppError(400, "email_off", "Email isn't configured on the platform yet.");
    await audit(t.business.id, { type: "user", id: t.user.id }, "invoice.emailed", inv.id, { to });
    return "Invoice sent";
  });
}
