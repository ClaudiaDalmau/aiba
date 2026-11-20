import { currencies, timezones } from "@/lib/locale-data";
import { getLocale, getT } from "@/i18n/server";
import { saveSettings } from "@/actions/workspace";
import { ConfirmSubmit, SubmitButton, Toggle } from "@/components/client";
import { Badge, Card, CardHeader, Field, Input, LinkButton, PageHeader, Select, Textarea } from "@/components/ui";
import { saveCalendarAction, disconnectCalendarAction } from "@/actions/calendar";
import { Icon } from "@/components/icons";
import { getConnection, googleConfigured } from "@/lib/google-calendar";
import { listStaff } from "@/lib/queries";
import { ActionForm } from "@/components/workspace/action-form";
import { CATEGORIES } from "@/lib/businesses";
import { currentTenant, requirePermission } from "@/lib/tenant";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Settings") };
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const t = await getT();
  const tenant = await currentTenant();
  requirePermission(tenant, "business.manage");
  const b = tenant.business;
  const p = b.policy;
  const sp = await searchParams;
  const [conn, gReady, staff] = await Promise.all([getConnection(b.id), googleConfigured(), listStaff(b.id)]);
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
            <Field label={t("Timezone")}><Select name="timezone" defaultValue={b.timezone}>{timezones().map((z) => <option key={z}>{z}</option>)}</Select></Field>
            <Field label={t("Currency")}><Select name="currency" defaultValue={b.currency}>{currencies(await getLocale()).map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}</Select></Field>
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

      <Card id="calendar" className="mt-6 scroll-mt-6">
        <CardHeader title="Google Calendar" description={t("See your AIBA bookings in your Google Calendar, and keep your personal events from being booked over.")} />
        <div className="space-y-4 p-5">
          {sp.google === "connected" && <p className="rounded-lg bg-ok/10 px-3 py-2 text-[13px] text-ok">{t("Google Calendar connected.")}</p>}
          {sp.google === "denied" && <p className="rounded-lg bg-warn/10 px-3 py-2 text-[13px] text-warn">{t("You didn't give access, so nothing was connected.")}</p>}
          {sp.google === "error" && <p className="rounded-lg bg-bad/10 px-3 py-2 text-[13px] text-bad">{t("Google didn't complete the connection. Try again and tick the calendar permission.")}</p>}
          {!gReady ? (
            <p className="text-[14px] text-muted">{t("Google Calendar isn't set up on this platform yet.")}</p>
          ) : !conn ? (
            <a href="/api/integrations/google/start" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-[14px] font-medium shadow-card hover:bg-subtle">
              <Icon name="calendar" size={16} /> {t("Connect Google Calendar")}
            </a>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-[14px]">
                <Badge tone={conn.lastError ? "bad" : "ok"}>{conn.lastError ? t("Needs reconnecting") : t("Connected")}</Badge>
                <span className="font-medium">{conn.accountEmail || "Google"}</span>
              </div>
              {conn.lastError && (
                <a href="/api/integrations/google/start" className="inline-flex text-[13px] font-medium text-ai hover:underline">{t("Reconnect")}</a>
              )}
              <ActionForm action={saveCalendarAction} className="space-y-4">
                <Toggle name="pushBookings" defaultChecked={conn.pushBookings} label={t("Add my bookings to Google Calendar")} description={t("New, moved and cancelled bookings update the calendar automatically.")} />
                <Toggle name="blockBusy" defaultChecked={conn.blockBusy} label={t("Block my busy times")} description={t("Your own Google events (not the ones AIBA creates) make those hours unavailable for booking. Events marked «free» don't block.")} />
                <Field label={t("Whose calendar is it?")} hint={t("its busy times block this person")}>
                  <Select name="staffId" defaultValue={conn.staffId ?? ""}>
                    <option value="">{t("Everyone (whole business)")}</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </Field>
                <SubmitButton variant="secondary" size="sm">{t("Save")}</SubmitButton>
              </ActionForm>
              <form action={disconnectCalendarAction}>
                <ConfirmSubmit message={t("Disconnect Google Calendar? Events already created stay in your calendar.")} variant="ghost">{t("Disconnect")}</ConfirmSubmit>
              </form>
            </>
          )}
        </div>
      </Card>
    </>
  );
}
