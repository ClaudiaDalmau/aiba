import { getT, tSync } from "@/i18n/server";
import { count } from "drizzle-orm";
import { deletePlan, savePlan } from "@/actions/admin-platform";
import { ConfirmSubmit, SubmitButton, Toggle } from "@/components/client";
import { Badge, Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/workspace/action-form";
import { db, schema } from "@/db";
import { requirePlatform } from "@/lib/auth";
import { stripeEnabled } from "@/lib/billing";
import { formatPlanPrice, listPlans } from "@/lib/plans";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Plans & pricing") };
}

type Plan = schema.Plan;

function PlanFields({ p }: { p?: Plan }) {
  const t = tSync();
  const e = p?.entitlements;
  return (
    <div className="space-y-4">
      {p && <input type="hidden" name="existingId" value={p.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("Name")}><Input name="name" defaultValue={p?.name} required /></Field>
        {p ? (
          <Field label={t("Plan id")} hint={t("fixed")}><Input value={p.id} disabled /></Field>
        ) : (
          <Field label={t("Plan id")} hint={t("e.g. pro")}><Input name="id" placeholder={t("from the name")} /></Field>
        )}
      </div>
      <Field label={t("Short description")}><Input name="description" defaultValue={p?.description} /></Field>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label={t("Price")}><Input name="price" type="number" min={0} step="0.01" defaultValue={p ? p.priceCents / 100 : ""} required /></Field>
        <Field label={t("Currency")}><Input name="currency" defaultValue={p?.currency ?? "EUR"} maxLength={3} /></Field>
        <Field label={t("Per")}>
          <Select name="interval" defaultValue={p?.interval ?? "month"}><option value="month">month</option><option value="year">year</option></Select>
        </Field>
        <Field label={t("Trial days")}><Input name="trialDays" type="number" min={0} defaultValue={p?.trialDays ?? 14} /></Field>
      </div>
      <Field label={t("Features")} hint={t("one per line, shown on pricing")}><Textarea name="features" rows={5} defaultValue={p?.features.join("\n")} /></Field>

      <div className="rounded-lg border border-border p-4">
        <div className="mb-3 text-[13px] font-semibold">{t("What the plan includes")}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("AI conversations / month")} hint={t("blank = unlimited")}><Input name="ent.maxConversationsPerMonth" type="number" min={0} defaultValue={e?.maxConversationsPerMonth ?? ""} /></Field>
          <Field label={t("Team members")} hint={t("blank = unlimited")}><Input name="ent.maxStaff" type="number" min={1} defaultValue={e?.maxStaff ?? ""} /></Field>
        </div>
        <div className="mt-4 grid gap-x-12 gap-y-3 sm:grid-cols-2">
          <Toggle name="ent.whatsapp" defaultChecked={e?.whatsapp ?? true} label={t("WhatsApp")} />
          <Toggle name="ent.telegram" defaultChecked={e?.telegram ?? true} label={t("Telegram")} />
          <Toggle name="ent.community" defaultChecked={e?.community ?? false} label={t("VIP community")} />
          <Toggle name="ent.featured" defaultChecked={e?.featured ?? false} label={t("Featured in marketplace")} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("Stripe price id")} hint={t("price_…")}><Input name="stripePriceId" defaultValue={p?.stripePriceId ?? ""} /></Field>
        <Field label={t("Display order")}><Input name="sortOrder" type="number" min={0} defaultValue={p?.sortOrder ?? 0} /></Field>
      </div>
      <div className="grid gap-x-12 gap-y-3 sm:grid-cols-3">
        <Toggle name="active" defaultChecked={p?.active ?? true} label={t("Available")} description={t("Can be chosen")} />
        <Toggle name="public" defaultChecked={p?.public ?? true} label={t("Public")} description={t("On pricing pages")} />
        <Toggle name="highlighted" defaultChecked={p?.highlighted ?? false} label={t("Highlighted")} description={t("“Most popular”")} />
      </div>
    </div>
  );
}

export default async function AdminPlans() {
  const t = await getT();
  await requirePlatform("plans.manage");
  const [plans, usage, stripe] = await Promise.all([
    listPlans(),
    db.select({ tier: schema.businesses.tier, n: count() }).from(schema.businesses).groupBy(schema.businesses.tier),
    stripeEnabled(),
  ]);
  const users = new Map(usage.map((u) => [u.tier, Number(u.n)]));
  return (
    <>
      <PageHeader eyebrow={t("Revenue")} title={t("Plans & pricing")} description={t("Prices, features and limits for every plan. Limits apply to subscribers immediately; the pricing page and billing page update automatically.")} />
      {!stripe && <p className="mb-6 rounded-card bg-warn/10 px-4 py-3 text-[14px] text-warn">{t("Stripe isn't connected: plan changes apply immediately without payment. Add the Stripe key in Settings and a Stripe price id on each paid plan.")}</p>}
      <div className="space-y-4">
        {plans.map((p) => {
          const price = formatPlanPrice(p);
          return (
            <Card key={p.id}>
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 font-semibold">
                      {p.name} <code className="text-[12px] font-normal text-faint">{p.id}</code>
                      {p.highlighted && <Badge tone="ai">{t("Highlighted")}</Badge>}
                      {!p.active && <Badge tone="warn">{t("Unavailable")}</Badge>}
                      {!p.public && <Badge>{t("Hidden")}</Badge>}
                    </div>
                    <div className="mt-0.5 text-[13px] text-muted">
                      {p.entitlements.maxConversationsPerMonth ?? "Unlimited"} AI conversations · {p.entitlements.maxStaff ?? "Unlimited"} staff
                      {p.entitlements.community ? " · community" : ""}
                      {p.entitlements.featured ? " · featured" : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[20px] font-semibold tabular-nums">{price.amount}<span className="text-[13px] font-normal text-muted">/{price.per}</span></div>
                    <div className="text-[12px] text-muted">{users.get(p.id) ?? 0} businesses</div>
                  </div>
                </summary>
                <div className="border-t border-border p-5">
                  <ActionForm action={savePlan}>
                    <PlanFields p={p} />
                    <SubmitButton className="mt-5">{t("Save")} {p.name}</SubmitButton>
                  </ActionForm>
                  <form action={deletePlan} className="mt-3">
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmSubmit variant="ghost" icon="trash" message={users.get(p.id) ? t("{n} businesses use {plan}. It will be archived (hidden and unavailable), not deleted.", { n: users.get(p.id) ?? 0, plan: p.name }) : `Delete ${p.name}?`}>
                      {users.get(p.id) ? t("Archive plan") : t("Delete plan")}
                    </ConfirmSubmit>
                  </form>
                </div>
              </details>
            </Card>
          );
        })}
        <Card>
          <CardHeader title={t("New plan")} />
          <ActionForm action={savePlan} className="p-5" resetOnSuccess>
            <PlanFields />
            <SubmitButton className="mt-5">{t("Create plan")}</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
