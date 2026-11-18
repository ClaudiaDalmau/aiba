import { currencies, timezones } from "@/lib/locale-data";
import { getLocale, getT } from "@/i18n/server";
import { redirect } from "next/navigation";
import { onboard } from "@/actions/workspace";
import { SubmitButton } from "@/components/client";
import { Card, Field, Input, Logo, Select, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/workspace/action-form";
import { requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/businesses";
import { membershipsOf } from "@/lib/tenant";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Set up your business") };
}


export default async function Onboarding({ searchParams }: { searchParams: Promise<{ another?: string }> }) {
  const t = await getT();
  const user = await requireUser("/app/onboarding");
  const { another } = await searchParams;
  if (!another && (await membershipsOf(user.id)).length) redirect("/app");

  return (
    <div className="min-h-dvh bg-subtle/50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Logo />
        <h1 className="mt-10 text-[32px] font-semibold tracking-tight">{t("Let's set up your business")}</h1>
        <p className="mt-1 text-muted">{t("Two minutes. We'll create your booking page and set up your own AI assistant.")}</p>

        <ActionForm action={onboard} className="mt-8 space-y-6">
          <Card className="space-y-4 p-6">
            <div className="text-[13px] font-semibold uppercase tracking-wider text-faint">{t("1 · Your business")}</div>
            <Field label={t("Business name")}><Input name="name" required placeholder={t("e.g. Atelier Nord")} autoFocus /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("Category")}>
                <Select name="category" defaultValue="hair">{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{t(c.label)}</option>)}</Select>
              </Field>
              <Field label={t("City")}><Input name="city" placeholder={t("Paris")} /></Field>
              <Field label={t("Timezone")}>
                <Select name="timezone" defaultValue="Europe/Madrid">{timezones().map((z) => <option key={z}>{z}</option>)}</Select>
              </Field>
              <Field label={t("Currency")}>
                <Select name="currency" defaultValue="EUR">{currencies(await getLocale()).map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</Select>
              </Field>
              <Field label={t("Phone")} hint={t("optional")}><Input name="phone" type="tel" /></Field>
              <Field label={t("Language")}>
                <Select name="language" defaultValue="es"><option value="en">English</option><option value="fr">Français</option><option value="es">Español</option><option value="de">Deutsch</option><option value="pt">Português</option></Select>
              </Field>
            </div>
            <Field label={t("Short description")} hint={t("your agent learns from this")}><Textarea name="description" rows={3} placeholder={t("What you do, what makes you different, who you serve.")} /></Field>
          </Card>

          <Card className="space-y-4 p-6">
            <div className="text-[13px] font-semibold uppercase tracking-wider text-faint">{t("2 · Your first service")}</div>
            <Field label={t("Service name")}><Input name="serviceName" placeholder={t("e.g. Haircut")} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("Duration (minutes)")}><Input name="serviceMinutes" type="number" min={5} step={5} defaultValue={60} /></Field>
              <Field label={t("Price")}><Input name="servicePrice" type="number" min={0} step="0.01" placeholder="45" /></Field>
            </div>
            <p className="text-[13px] text-muted">{t("We'll add you as the first team member, open Monday–Friday 9:00–18:00. You can change everything later.")}</p>
          </Card>

          <Card className="space-y-4 p-6">
            <div className="text-[13px] font-semibold uppercase tracking-wider text-faint">{t("3 · Your assistant's voice")}</div>
            <div className="grid gap-2 sm:grid-cols-5">
              {[
                ["warm", t("Warm")],
                ["professional", t("Professional")],
                ["playful", t("Playful")],
                ["luxury", t("Luxury")],
                ["concise", t("Concise")],
              ].map(([v, l], i) => (
                <label key={v} className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-2.5 text-center text-[14px] has-checked:border-fg has-checked:ring-2 has-checked:ring-fg/10">
                  <input type="radio" name="tone" value={v} defaultChecked={i === 0} className="sr-only" />
                  {l}
                </label>
              ))}
            </div>
          </Card>

          <SubmitButton size="lg" className="w-full" pendingText={t("Provisioning your assistant…")} icon="sparkles">{t("Create my business")}</SubmitButton>
        </ActionForm>
      </div>
    </div>
  );
}
