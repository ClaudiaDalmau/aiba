import { saveSettings } from "@/actions/workspace";
import { SubmitButton, Toggle } from "@/components/client";
import { Card, CardHeader, Field, Input, LinkButton, PageHeader, Select, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/workspace/action-form";
import { CATEGORIES } from "@/lib/businesses";
import { currentTenant, requirePermission } from "@/lib/tenant";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Settings") };
}

export default async function SettingsPage() {
  const t = await getT();
  const tenant = await currentTenant();
  requirePermission(tenant, "business.manage");
  const b = tenant.business;
  const p = b.policy;
  return (
    <>
      <PageHeader eyebrow={t("Business")} title={t("Settings")} description={t("Your public profile, branding and booking rules. Your agent reads all of this.")} actions={<LinkButton href={`/b/${b.slug}`} target="_blank" variant="secondary" icon="external">{t("View booking page")}</LinkButton>} />
      <ActionForm action={saveSettings} className="space-y-6">
        <Card>
          <CardHeader title={t("Publishing")} />
          <div className="p-5">
            <Toggle name="published" defaultChecked={b.published} label={t("Listed in the marketplace & bookable")} description={t("Your page lives at /b/{slug}. Unpublished pages are only visible to your team.", { slug: b.slug })} />
          </div>
        </Card>
        <Card>
          <CardHeader title={t("Profile")} />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label={t("Business name")}><Input name="name" defaultValue={b.name} required /></Field>
            <Field label={t("Tagline")}><Input name="tagline" defaultValue={b.tagline} maxLength={140} /></Field>
            <Field label={t("Description")} className="sm:col-span-2"><Textarea name="description" rows={4} defaultValue={b.description} /></Field>
            <Field label={t("Category")}><Select name="category" defaultValue={b.category}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{t(c.label)}</option>)}</Select></Field>
            <Field label={t("City")}><Input name="city" defaultValue={b.city} /></Field>
            <Field label={t("Phone")}><Input name="phone" defaultValue={b.phone} /></Field>
            <Field label={t("Email")}><Input name="email" type="email" defaultValue={b.email} /></Field>
            <Field label={t("Website")}><Input name="website" defaultValue={b.website} /></Field>
            <Field label={t("Timezone")}><Input name="timezone" defaultValue={b.timezone} /></Field>
            <Field label={t("Currency")}><Input name="currency" defaultValue={b.currency} maxLength={3} /></Field>
          </div>
        </Card>
        <Card>
          <CardHeader title={t("Branding")} />
          <div className="grid gap-4 p-5 sm:grid-cols-[120px_1fr_1fr]">
            <Field label={t("Brand color")}><Input type="color" name="brandColor" defaultValue={b.brandColor} className="p-1" /></Field>
            <Field label={t("Cover image URL")}><Input name="coverUrl" type="url" defaultValue={b.coverUrl ?? ""} placeholder="https://…" /></Field>
            <Field label={t("Logo URL")}><Input name="logoUrl" type="url" defaultValue={b.logoUrl ?? ""} placeholder="https://…" /></Field>
          </div>
        </Card>
        <Card>
          <CardHeader title={t("Booking rules")} />
          <div className="grid gap-4 p-5 sm:grid-cols-4">
            <Field label={t("Min. notice")} hint={t("minutes")}><Input name="minNoticeMinutes" type="number" min={0} defaultValue={p.minNoticeMinutes} /></Field>
            <Field label={t("Book ahead")} hint={t("days")}><Input name="maxAdvanceDays" type="number" min={1} defaultValue={p.maxAdvanceDays} /></Field>
            <Field label={t("Free cancellation")} hint={t("hours before")}><Input name="cancellationWindowHours" type="number" min={0} defaultValue={p.cancellationWindowHours} /></Field>
            <Field label={t("Slot grid")} hint={t("minutes")}><Select name="slotIntervalMinutes" defaultValue={String(p.slotIntervalMinutes)}>{[5, 10, 15, 20, 30, 60].map((n) => <option key={n}>{n}</option>)}</Select></Field>
            <div className="space-y-4 sm:col-span-4">
              <Toggle name="autoConfirm" defaultChecked={p.autoConfirm} label={t("Confirm bookings automatically")} description={t("Off: web and agent bookings arrive as requests you confirm.")} />
              <Toggle name="requirePayment" defaultChecked={p.requirePayment} label={t("Require online payment")} description={t("Requires Stripe to be configured on the platform.")} />
            </div>
            <Field label={t("Policy shown to customers")} className="sm:col-span-4"><Textarea name="policyText" rows={3} defaultValue={p.policyText} placeholder={t("Late arrivals, deposits, what to bring…")} /></Field>
          </div>
        </Card>
        <div className="sticky bottom-4 flex justify-end"><SubmitButton size="lg">{t("Save settings")}</SubmitButton></div>
      </ActionForm>
    </>
  );
}
