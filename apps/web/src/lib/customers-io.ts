import "server-only";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { badRequest } from "./errors";
import { findOrCreateCustomer } from "./bookings";

/** Minimal CSV parser: auto-detects , ; or tab; handles quotes and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delim = [";", "\t", ","].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");
const HEADERS: Record<"name" | "first" | "last" | "email" | "phone" | "notes", string[]> = {
  name: ["name", "nombre", "nom", "nome", "fullname", "nombrecompleto", "cliente", "client", "customer", "kunde", "imya", "имя"],
  first: ["firstname", "givenname", "nombrepila", "prenom", "vorname"],
  last: ["lastname", "surname", "apellido", "apellidos", "familyname", "nachname", "cognome", "sobrenome"],
  email: ["email", "mail", "correo", "correoelectronico", "emailaddress", "courriel"],
  phone: ["phone", "telefono", "tel", "movil", "mobile", "celular", "telephone", "phonenumber", "whatsapp", "handy", "telefone", "telefon"],
  notes: ["notes", "notas", "nota", "comments", "comentarios", "observaciones", "remarques", "notizen", "note"],
};

export async function importCustomers(businessId: string, csv: string) {
  const rows = parseCsv(csv);
  if (rows.length < 2) throw badRequest("The file has no rows. The first row must be the column names.");
  const head = rows[0].map(norm);
  const col = (k: keyof typeof HEADERS) => head.findIndex((h) => HEADERS[k].map(norm).includes(h));
  const ix = { name: col("name"), first: col("first"), last: col("last"), email: col("email"), phone: col("phone"), notes: col("notes") };
  if (ix.name < 0 && ix.first < 0) throw badRequest("No name column found. Name the columns e.g. name, email, phone, notes.");
  if (ix.email < 0 && ix.phone < 0) throw badRequest("No email or phone column found. Name the columns e.g. name, email, phone, notes.");
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const before = Number((await db.execute(sql`select count(*)::int as n from customers where business_id = ${businessId}`)).rows[0]?.n ?? 0);
  for (const r of rows.slice(1, 5001)) {
    const get = (i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
    const name = get(ix.name) || [get(ix.first), get(ix.last)].filter(Boolean).join(" ");
    const email = get(ix.email).toLowerCase();
    const phone = get(ix.phone);
    if (!name || (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && phone.replace(/\D/g, "").length < 6)) {
      skipped++;
      continue;
    }
    const c = await findOrCreateCustomer(businessId, { name, email: /@/.test(email) ? email : undefined, phone: phone || undefined });
    const notes = get(ix.notes);
    if (notes && !c.notes.includes(notes)) await db.update(schema.customers).set({ notes: c.notes ? `${c.notes}\n${notes}` : notes }).where(eq(schema.customers.id, c.id));
  }
  const after = Number((await db.execute(sql`select count(*)::int as n from customers where business_id = ${businessId}`)).rows[0]?.n ?? 0);
  created = after - before;
  updated = rows.length - 1 - skipped - created;
  return { created, updated: Math.max(0, updated), skipped, truncated: rows.length - 1 > 5000 };
}

export async function exportCustomersCsv(businessId: string) {
  const rows = await db
    .select({
      c: schema.customers,
      visits: sql<number>`count(${schema.bookings.id}) filter (where ${schema.bookings.status} in ('completed','confirmed'))::int`,
      spent: sql<number>`coalesce(sum(${schema.bookings.priceCents}) filter (where ${schema.bookings.status} in ('completed','confirmed')), 0)::int`,
      last: sql<string | null>`to_char(max(${schema.bookings.startsAt}) filter (where ${schema.bookings.status} <> 'cancelled'), 'YYYY-MM-DD')`,
    })
    .from(schema.customers)
    .leftJoin(schema.bookings, eq(schema.bookings.customerId, schema.customers.id))
    .where(and(eq(schema.customers.businessId, businessId), isNull(schema.customers.erasedAt)))
    .groupBy(schema.customers.id)
    .orderBy(schema.customers.name);
  const cell = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = rows.map(({ c, visits, spent, last }) =>
    [c.name, c.email ?? "", c.phone ?? "", c.notes, c.marketingConsent ? "yes" : "no", c.createdAt.toISOString().slice(0, 10), String(visits), (spent / 100).toFixed(2).replace(".", ","), last ?? ""].map(cell).join(";"),
  );
  return "﻿" + ["name;email;phone;notes;marketing_consent;customer_since;visits;spent;last_visit", ...lines].join("\r\n");
}
