/**
 * Sensible manual-review list. Admins keep it in Settings → Sensible (stored in the database, never in
 * the repo). When a Sensible access request or a new Sensible profile matches an entry, the person is
 * told they're on the waitlist and the platform team gets an alert to accept or reject by hand.
 *
 * One entry per line (commas and semicolons also separate). Lines starting with # are labels/comments.
 * Each entry is detected automatically: email · phone (any format, country code optional) · website or
 * domain · otherwise a name (matched as whole words against the person's or business name).
 *
 * Pure functions only (no DB), so they can be unit-tested.
 */

export type ReviewEntry = { type: "email" | "phone" | "domain" | "name"; value: string; raw: string; label: string };

export type ReviewCandidate = {
  email?: string;
  name?: string;
  businessName?: string;
  phone?: string;
  website?: string;
  links?: string[];
  message?: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits = (s: string) => s.replace(/\D/g, "");
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

function hostOf(s: string): string {
  const v = s.trim().toLowerCase();
  if (!v) return "";
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//.test(v) ? v : `https://${v}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function parseReviewList(text: string | null | undefined): ReviewEntry[] {
  const out: ReviewEntry[] = [];
  let label = "";
  for (const line of String(text ?? "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) {
      label = trimmed.replace(/^#+/, "").trim();
      continue;
    }
    for (const part of trimmed.split(/[;,]/)) {
      const raw = part.trim().replace(/^(mailto|tel):/i, "");
      if (!raw) continue;
      if (EMAIL.test(raw)) out.push({ type: "email", value: raw.toLowerCase(), raw, label });
      else if (/^[+\d\s().-]+$/.test(raw) && digits(raw).length >= 7) out.push({ type: "phone", value: digits(raw), raw, label });
      else if (!/\s/.test(raw) && raw.includes(".") && hostOf(raw)) out.push({ type: "domain", value: hostOf(raw), raw, label });
      else if (fold(raw).length >= 3) out.push({ type: "name", value: fold(raw), raw, label });
    }
  }
  return out;
}

/** Same number if equal, or if one ends with the other (country code missing) and the shorter has ≥ 9 digits. */
function samePhone(a: string, b: string) {
  if (!a || !b) return false;
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return short.length >= 9 && long.endsWith(short);
}

/** Entries the candidate matches (empty = no match). */
export function matchReviewList(list: ReviewEntry[], c: ReviewCandidate): ReviewEntry[] {
  if (!list.length) return [];
  const email = (c.email ?? "").trim().toLowerCase();
  const message = c.message ?? "";
  const phones = [c.phone ?? "", ...(message.match(/\+?\d[\d\s().-]{6,}\d/g) ?? [])].map(digits).filter((p) => p.length >= 7);
  const urls = [c.website ?? "", ...(c.links ?? []), ...(message.match(/\b(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}\S*/gi) ?? [])];
  const hosts = urls.map(hostOf).filter(Boolean);
  const names = [c.name ?? "", c.businessName ?? ""].map(fold).filter(Boolean);
  const text = fold([message, ...(c.links ?? []), c.website ?? ""].join(" "));

  return list.filter((e) => {
    switch (e.type) {
      case "email":
        return email === e.value || message.toLowerCase().includes(e.value);
      case "phone":
        return phones.some((p) => samePhone(p, e.value));
      case "domain":
        return hosts.some((h) => h === e.value || h.endsWith(`.${e.value}`)) || message.toLowerCase().includes(e.value);
      case "name":
        return [...names, text].some((n) => ` ${n} `.includes(` ${e.value} `));
    }
  });
}

/** Short human summary for alerts and the admin list, e.g. «Emma dating: email, phone». */
export function describeMatches(matches: ReviewEntry[]): string {
  const byLabel = new Map<string, Set<string>>();
  for (const m of matches) {
    const k = m.label || m.raw;
    if (!byLabel.has(k)) byLabel.set(k, new Set());
    byLabel.get(k)!.add(m.label ? `${m.type} ${m.raw}` : m.type);
  }
  return [...byLabel].map(([k, v]) => `${k}: ${[...v].join(", ")}`).join(" · ");
}
