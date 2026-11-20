import { getT } from "@/i18n/server";
import Link from "next/link";
import { sql } from "drizzle-orm";
import { Table, Td } from "@/components/admin/table";
import { Badge, Card, PageHeader, Stat } from "@/components/ui";
import { db } from "@/db";
import { requestIntlLocale } from "@/i18n/request-locale";
import { requirePlatform } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("AI usage") };
}

type Row = { id: string; name: string; tier: string; platform: string; turns: number; inbound: number; input: number; output: number };

/** AI consumption per business and plan for one month: the data behind pricing decisions. */
export default async function AdminUsage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const t = await getT();
  await requirePlatform("billing.view");
  const now = new Date();
  const cur = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const { m } = await searchParams;
  const month = m && /^\d{4}-\d{2}$/.test(m) ? m : cur;
  const [y, mo] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, mo - 1, 1));
  const to = new Date(Date.UTC(y, mo, 1));
  const prev = new Date(Date.UTC(y, mo - 2, 1)).toISOString().slice(0, 7);
  const next = to.toISOString().slice(0, 7);

  const rows = (
    await db.execute(sql`
      select b.id, b.name, b.tier, b.platform,
        count(*) filter (where u.kind = 'agent_turn')::int as turns,
        count(*) filter (where u.kind = 'message_in')::int as inbound,
        coalesce(sum(u.input_tokens), 0)::bigint as input,
        coalesce(sum(u.output_tokens), 0)::bigint as output
      from usage_events u join businesses b on b.id = u.business_id
      where u.created_at >= ${from} and u.created_at < ${to}
      group by b.id order by sum(u.input_tokens + u.output_tokens) desc nulls last`)
  ).rows.map((r) => ({ ...(r as Row), input: Number((r as Row).input), output: Number((r as Row).output) }));

  const s = await getSettings();
  const pin = Number(s["ai.priceInput"]) || 0;
  const pout = Number(s["ai.priceOutput"]) || 0;
  const priced = pin > 0 || pout > 0;
  const cost = (i: number, o: number) => (i * pin + o * pout) / 1_000_000;
  const n = (v: number) => new Intl.NumberFormat(requestIntlLocale()).format(Math.round(v));
  const usd = (v: number) => (priced ? new Intl.NumberFormat(requestIntlLocale(), { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(v) : "—");

  // Per plan and platform: how many businesses, and what an average and a heavy one consume.
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const k = `${r.platform}·${r.tier}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const plans = [...groups.entries()].map(([k, list]) => {
    const tok = list.map((r) => r.input + r.output).sort((a, b) => a - b);
    const p90 = tok[Math.min(tok.length - 1, Math.floor(tok.length * 0.9))];
    const sumIn = list.reduce((a, r) => a + r.input, 0);
    const sumOut = list.reduce((a, r) => a + r.output, 0);
    const turns = list.reduce((a, r) => a + r.turns, 0);
    return { k, platform: list[0].platform, tier: list[0].tier, count: list.length, avgTok: (sumIn + sumOut) / list.length, p90, avgCost: cost(sumIn, sumOut) / list.length, perTurn: turns ? (sumIn + sumOut) / turns : 0 };
  });
  const totIn = rows.reduce((a, r) => a + r.input, 0);
  const totOut = rows.reduce((a, r) => a + r.output, 0);
  const totTurns = rows.reduce((a, r) => a + r.turns, 0);

  return (
    <>
      <PageHeader
        eyebrow={t("Revenue")}
        title={t("AI usage")}
        description={t("Tokens the assistant consumed per business and plan. Use it to price plans: a plan must cover what a heavy business (90th percentile) consumes.")}
      />
      <div className="mb-4 flex items-center gap-3 text-[14px]">
        <Link href={`/admin/usage?m=${prev}`} className="text-muted hover:text-ink">← {prev}</Link>
        <span className="font-semibold">{month}</span>
        {month < cur && <Link href={`/admin/usage?m=${next}`} className="text-muted hover:text-ink">{next} →</Link>}
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Stat label={t("Assistant replies")} value={n(totTurns)} icon="sparkles" />
        <Stat label={t("Input tokens")} value={n(totIn)} />
        <Stat label={t("Output tokens")} value={n(totOut)} />
        <Stat label={t("Estimated cost")} value={usd(cost(totIn, totOut))} sub={priced ? undefined : t("Set the token prices in Settings → AI agents")} tone="ai" />
      </div>
      <Card className="mb-6">
        <h2 className="px-4 pt-4 text-[15px] font-semibold">{t("By plan")}</h2>
        <Table head={[t("Platform"), t("Plan"), t("Businesses"), t("Average tokens"), t("Heavy business (p90)"), t("Tokens per reply"), t("Average cost")]}>
          {plans.map((p) => (
            <tr key={p.k}>
              <Td><Badge tone={p.platform === "sensitive" ? "warn" : "neutral"}>{p.platform === "sensitive" ? t("Sensible") : t("Ordinary")}</Badge></Td>
              <Td>{p.tier}</Td>
              <Td>{p.count}</Td>
              <Td>{n(p.avgTok)}</Td>
              <Td>{n(p.p90)}</Td>
              <Td>{n(p.perTurn)}</Td>
              <Td>{usd(p.avgCost)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card>
        <h2 className="px-4 pt-4 text-[15px] font-semibold">{t("By business")}</h2>
        <Table
          head={[t("Business"), t("Plan"), t("Messages received"), t("Assistant replies"), t("Input tokens"), t("Output tokens"), t("Estimated cost")]}
          empty={rows.length === 0 ? <p className="p-6 text-center text-[14px] text-muted">{t("No AI usage this month.")}</p> : undefined}
        >
          {rows.map((r) => (
            <tr key={r.id}>
              <Td><Link href={`/admin/businesses/${r.id}`} className="font-medium hover:underline">{r.name}</Link></Td>
              <Td>{r.tier}{r.platform === "sensitive" ? " · S" : ""}</Td>
              <Td>{n(r.inbound)}</Td>
              <Td>{n(r.turns)}</Td>
              <Td>{n(r.input)}</Td>
              <Td>{n(r.output)}</Td>
              <Td>{usd(cost(r.input, r.output))}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
