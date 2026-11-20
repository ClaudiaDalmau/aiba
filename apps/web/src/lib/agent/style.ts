import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { and, asc, desc, eq, inArray, notLike } from "drizzle-orm";
import { db, schema } from "@/db";
import { badRequest } from "../errors";
import { getSettings } from "../settings";

/**
 * «Learn my style»: build a short style guide from how the OWNER writes to customers, so the agent
 * sounds like her. Sources: her manual replies in the inbox (incl. WhatsApp history imported at link
 * time) and chat exports she uploads (WhatsApp .txt, Telegram .json). Only her patterns end up in the
 * guide — never customer names or details — and she reviews it before it is used.
 */

export type Pair = { customer: string; owner: string };

const MAX_PAIRS = 150;
const clip = (s: string, n = 500) => (s.length > n ? `${s.slice(0, n)}…` : s);

/** Remove obvious personal data before anything leaves the database. */
export function redact(s: string) {
  return s
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/https?:\/\/\S+/g, "[link]")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "[phone]")
    .trim();
}

/** Owner replies from the inbox, each with the customer message that preceded it. */
export async function inboxPairs(businessId: string): Promise<Pair[]> {
  const convs = await db
    .select({ id: schema.conversations.id })
    .from(schema.conversations)
    .where(and(eq(schema.conversations.businessId, businessId), notLike(schema.conversations.externalThreadId, "test:%")))
    .orderBy(desc(schema.conversations.lastMessageAt))
    .limit(200);
  if (!convs.length) return [];
  const msgs = await db
    .select({ conversationId: schema.messages.conversationId, role: schema.messages.role, content: schema.messages.content })
    .from(schema.messages)
    .where(and(eq(schema.messages.businessId, businessId), inArray(schema.messages.conversationId, convs.map((c) => c.id))))
    .orderBy(asc(schema.messages.conversationId), asc(schema.messages.createdAt));
  const pairs: Pair[] = [];
  let lastCustomer = "";
  let conv = "";
  for (const m of msgs) {
    if (m.conversationId !== conv) {
      conv = m.conversationId;
      lastCustomer = "";
    }
    if (m.role === "customer") lastCustomer = m.content;
    else if (m.role === "owner" && m.content.trim()) pairs.push({ customer: lastCustomer, owner: m.content });
  }
  return pairs.slice(-MAX_PAIRS);
}

/** Parse a WhatsApp ("Export chat" .txt) or Telegram Desktop (result.json) export. */
export function parseExport(text: string, ownerName: string): Pair[] {
  const me = ownerName.trim().toLowerCase();
  if (!me) throw badRequest("Write your name exactly as it appears in the chat");
  const lines: { from: string; text: string }[] = [];
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    let data: { messages?: { from?: string; text?: unknown; type?: string }[] };
    try {
      data = JSON.parse(trimmed);
    } catch {
      throw badRequest("This file couldn't be read. Upload the .txt (WhatsApp) or result.json (Telegram) export.");
    }
    for (const m of data.messages ?? []) {
      if (m.type && m.type !== "message") continue;
      const t = typeof m.text === "string" ? m.text : Array.isArray(m.text) ? m.text.map((x) => (typeof x === "string" ? x : (x as { text?: string }).text ?? "")).join("") : "";
      if (m.from && t) lines.push({ from: m.from, text: t });
    }
  } else {
    // 12/03/2025, 14:05 - Name: text   |   [12/03/25, 14:05:33] Name: text
    const re = /^\[?\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4},?\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap]\.?[Mm]\.?)?\]?\s*(?:[-–]\s*)?([^:]{1,60}):\s?(.*)$/;
    for (const raw of trimmed.split(/\r?\n/)) {
      const line = raw.replace(/^‎/, "");
      const m = re.exec(line);
      if (m) lines.push({ from: m[1].trim(), text: m[2] });
      else if (lines.length && line.trim()) lines[lines.length - 1].text += `\n${line}`; // multi-line message
    }
  }
  if (!lines.length) throw badRequest("No messages found in this file. Upload the .txt (WhatsApp) or result.json (Telegram) export.");
  const pairs: Pair[] = [];
  let lastCustomer = "";
  const skip = /<(media omitted|multimedia omitido|archivo omitido)>|^null$/i;
  for (const l of lines) {
    if (skip.test(l.text.trim())) continue;
    if (l.from.toLowerCase().includes(me)) pairs.push({ customer: lastCustomer, owner: l.text });
    else lastCustomer = l.text;
  }
  if (!pairs.length) throw badRequest("None of the messages are from that name. Check how your name appears in the chat.");
  return pairs.slice(-MAX_PAIRS);
}

/** Ask Claude for a concise, editable style guide in the owner's own language. */
export async function generateStyleGuide(business: schema.Business, agent: schema.Agent, pairs: Pair[]): Promise<string> {
  if (pairs.length < 5) throw badRequest("Not enough of your replies yet: answer a few customers yourself or upload a chat export, then try again.");
  const s = await getSettings();
  const key = s["ai.anthropicApiKey"];
  if (!key) throw badRequest("Add the Anthropic API key in Admin → Settings → AI agents first.");
  const client = new Anthropic({ apiKey: key });
  const examples = pairs
    .map((p, i) => `#${i + 1}\nCUSTOMER: ${clip(redact(p.customer || "(start of chat)"), 300)}\nOWNER: ${clip(redact(p.owner))}`)
    .join("\n\n");
  const lang = agent.persona.language || business.locale || "es";
  const res = await client.messages.create({
    model: s["ai.model"] || "claude-sonnet-5-5",
    max_tokens: 2000,
    system:
      "You analyse how a small-business owner writes to her customers on WhatsApp/Telegram, so an AI assistant can answer in her voice. " +
      "Write ONLY about her writing style and her usual answers. Never include customers' names, personal details, or any sexual or explicit content; " +
      "if examples contain such content, ignore it. Output plain text (no markdown headings), max 350 words, in the language with code: " + lang + ".",
    messages: [
      {
        role: "user",
        content:
          `Business: ${business.name} (${business.category}).\nHere are real exchanges; OWNER lines are hers:\n\n${examples}\n\n` +
          "Write a style guide the assistant can follow, with these short sections (one line title, then bullets):\n" +
          "1. Tone and how she treats customers (tú/usted, warmth, humour)\n2. Greetings and sign-offs she actually uses\n" +
          "3. Message length and rhythm (short messages? several in a row? punctuation, capitals)\n4. Emoji and expressions she repeats (quote short literal phrases)\n" +
          "5. How she answers prices, availability, changes/cancellations, late arrivals and doubts\n6. Things she never does or says",
      },
    ],
  });
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text) throw badRequest("The AI couldn't produce a style guide from these messages. Try with more of your replies.");
  return text.slice(0, 4000);
}
