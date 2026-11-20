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
import { allowedCountries } from "@/lib/sensitive";
import { LOCALE_NAMES, LOCALES } from "@/i18n/config";
import Link from "next/link";
import { cx } from "@/components/ui";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Set up your business") };
}


export default async function Onboarding({ searchParams }: { searchParams: Promise<{ another?: string; platform?: string }> }) {
  const t = await getT();
  const user = await requireUser("/app/onboarding");
  const { another, platform: pf } = await searchParams;
  const sensitive = pf === "sensitive";
  const countries = sensitive ? await allowedCountries() : [];
  const regionName = new Intl.DisplayNames([await getLocale()], { type: "region" });
  if (!another && (await membershipsOf(user.id)).length) redirect("/app");

  return (
    <div className="min-h-dvh bg-subtle/50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Logo />
        <h1 className="mt-10 text-[32px] font-semibold tracking-tight">{t("Let's set up your business")}</h1>
        <p className="mt-1 text-muted">{t("Two minutes. We'll create your booking page and set up your own AI assistant.")}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href={`/app/onboarding?${another ? "another=1&" : ""}platform=ordinary`} className={cx("rounded-xl border p-4 text-[14px]", !sensitive ? "border-ai bg-ai/5" : "border-border bg-surface hover:border-fg/30")}>
            <div className="font-semibold">{t("AIBA Ordinary")}</div>
            <div className="text-muted">{t("Any independent professional or business. Listed in the AIBA directory.")}</div>
          </Link>
          <Link href={`/app/onboarding?${another ? "another=1&" : ""}platform=sensitive`} className={cx("rounded-xl border p-4 text-[14px]", sensitive ? "border-ai bg-ai/5" : "border-border bg-surface hover:border-fg/30")}>
            <div className="font-semibold">{t("AIBA Sensible (18+)")}</div>
            <div className="text-muted">{t("Adult, voluntary and independent work. Private page by link only, sign-in with fingerprint or face.")}</div>
          </Link>
        </div>

        <ActionForm action={onboard} className="mt-8 space-y-6">
          <input type="hidden" name="platform" value={sensitive ? "sensitive" : "ordinary"} />
          {sensitive && (
            <Card className="space-y-3 border-ai/30 p-6 text-[14px]">
              <div className="text-[13px] font-semibold uppercase tracking-wider text-faint">{t("Before you start")}</div>
              <p className="text-muted">{t("AIBA is appointment-management software for adults who work independently. We don't intermediate, we don't take commission, and we never manage anyone's work on their behalf. Each profile belongs to one verified person.")}</p>
              <label className="flex items-start gap-2"><input type="checkbox" name="adult" required className="mt-1" /> {t("I am of legal age in my country.")}</label>
              <label className="flex items-start gap-2"><input type="checkbox" name="independent" required className="mt-1" /> {t("I work independently and voluntarily; nobody manages my work or receives my earnings.")}</label>
              <Field label={t("Country where you work")}>
                <Select name="country" required defaultValue="">
                  <option value="" disabled>{t("Choose…")}</option>
                  {countries.map((c) => <option key={c} value={c}>{regionName.of(c) ?? c}</option>)}
                </Select>
              </Field>
              {!countries.length && <p className="text-[13px] text-warn">{t("The Sensible platform isn't available in any country yet.")}</p>}
            </Card>
          )}
          <Card className="space-y-4 p-6">
            <div className="text-[13px] font-semibold uppercase tracking-wider text-faint">{t("1 · Your business")}</div>
            <Field label={sensitive ? t("Profile name") : t("Business name")}><Input name="name" required placeholder={sensitive ? t("The name you work with") : t("e.g. Atelier Nord")} autoFocus /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              {!sensitive && (
                <Field label={t("Category")}>
                  <Select name="category" defaultValue="hair">{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{t(c.label)}</option>)}</Select>
                </Field>
              )}
              <Field label={t("City")}><Input name="city" placeholder={t("Paris")} /></Field>
              <Field label={t("Timezone")}>
                <Select name="timezone" defaultValue="Europe/Madrid">{timezones().map((z) => <option key={z}>{z}</option>)}</Select>
              </Field>
              <Field label={t("Currency")}>
                <Select name="currency" defaultValue="EUR">{currencies(await getLocale()).map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</Select>
              </Field>
              <Field label={t("Phone")} hint={t("optional")}><Input name="phone" type="tel" /></Field>
              <Field label={t("Language")}>
                <Select name="language" defaultValue={await getLocale()}>{LOCALES.map((l) => <option key={l} value={l}>{LOCALE_NAMES[l]}</option>)}</Select>
              </Field>
            </div>
            {!sensitive && <Field label={t("Short description")} hint={t("your agent learns from this")}><Textarea name="description" rows={3} placeholder={t("What you do, what makes you different, who you serve.")} /></Field>}
            {sensitive && <p className="text-[13px] text-muted">{t("Your private details (services, rates, limits) go in your Private sheet once inside. The assistant never reads it.")}</p>}
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
