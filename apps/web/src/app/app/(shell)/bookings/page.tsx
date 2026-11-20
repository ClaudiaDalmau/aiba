import { requestIntlLocale } from "@/i18n/request-locale";
import { getT } from "@/i18n/server";
import Link from "next/link";
import { blockTimeAction, bookingAction, createBookingAction, rescheduleAction, unblockTimeAction } from "@/actions/workspace";
import { and, eq, gt, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { ConfirmSubmit, SubmitButton, Toggle } from "@/components/client";
import { Icon } from "@/components/icons";
import { Badge, BOOKING_LABEL, BOOKING_TONE, Button, Card, cx, Field, Input, LinkButton, PageHeader, Select, Textarea } from "@/components/ui";
import { ActionForm } from "@/components/workspace/action-form";
import { getBookingRow, listBookings, listCustomers, listServices, listStaff, type BookingRow } from "@/lib/queries";
import { currentTenant } from "@/lib/tenant";
import { waitlistCount } from "@/lib/waitlist";
import { addDays, formatMoney, formatTime, minutesToHHMM, todayIn, weekdayOf, zonedParts, zonedToUtc } from "@/lib/time";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Bookings") };
}

const START_HOUR = 7;
const END_HOUR = 21;
const PX_PER_MIN = 1.1;

type SP = { date?: string; view?: "day" | "week"; new?: string; focus?: string; staff?: string; block?: string; off?: string };

export default async function BookingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const t = await getT();
  const sp = await searchParams;
  const tenant = await currentTenant();
  const tz = tenant.business.timezone;
  const view = sp.view === "day" ? "day" : "week";
  const anchor = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayIn(tz);
  const start = view === "week" ? addDays(anchor, -((weekdayOf(anchor) + 6) % 7)) : anchor;
  const days = Array.from({ length: view === "week" ? 7 : 1 }, (_, i) => addDays(start, i));
  const rangeFrom = zonedToUtc(days[0], 0, tz);
  const rangeTo = zonedToUtc(addDays(days[days.length - 1], 1), 0, tz);
  const [bookings, staff, services, pending, waiting, offs] = await Promise.all([
    listBookings(tenant.business.id, { from: zonedToUtc(days[0], 0, tz), to: zonedToUtc(addDays(days[days.length - 1], 1), 0, tz), status: ["pending", "confirmed", "completed", "no_show"] }),
    listStaff(tenant.business.id),
    listServices(tenant.business.id, false),
    listBookings(tenant.business.id, { from: new Date(), status: ["pending"] }),
    waitlistCount(tenant.business),
    db.select().from(schema.timeOff).where(and(eq(schema.timeOff.businessId, tenant.business.id), lt(schema.timeOff.startsAt, rangeTo), gt(schema.timeOff.endsAt, rangeFrom))),
  ]);
  const focus = sp.focus ? await getBookingRow(tenant.business.id, sp.focus).catch(() => null) : null;
  const q = (p: Partial<SP>) => {
    const u = new URLSearchParams({ view, date: anchor, ...(sp.staff ? { staff: sp.staff } : {}), ...Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)) } as Record<string, string>);
    return `/app/bookings?${u}`;
  };
  const shown = sp.staff ? bookings.filter((b) => b.staff.id === sp.staff) : bookings;
  const columns = view === "day" ? staff.filter((s) => s.active && (!sp.staff || s.id === sp.staff)).map((s) => ({ key: s.id, label: s.name, date: anchor, items: shown.filter((b) => b.staff.id === s.id) })) : days.map((d) => ({ key: d, label: d, date: d, items: shown.filter((b) => zonedParts(b.startsAt, tz).date === d) }));
  const offsFor = (c: { key: string; date: string }) =>
    offs.filter((o) => (view === "day" ? !o.staffId || o.staffId === c.key : !o.staffId || !sp.staff || o.staffId === sp.staff)).flatMap((o) => {
      const dayStart = zonedToUtc(c.date, 0, tz).getTime();
      const dayEnd = zonedToUtc(addDays(c.date, 1), 0, tz).getTime();
      const s0 = Math.max(o.startsAt.getTime(), dayStart);
      const e0 = Math.min(o.endsAt.getTime(), dayEnd);
      return e0 > s0 ? [{ o, from: (s0 - dayStart) / 60000, to: (e0 - dayStart) / 60000 }] : [];
    });
  const staffName = new Map(staff.map((s) => [s.id, s.name]));
  const today = todayIn(tz);
  const rangeLabel = view === "week" ? `${fmtDay(days[0], tz)} – ${fmtDay(days[6], tz)}` : fmtDay(anchor, tz, true);

  return (
    <>
      <PageHeader
        title={t("Bookings")}
        description={rangeLabel}
        actions={
          <>
            <LinkButton href="/app/bookings/waitlist" variant="ghost" icon="bell">{t("Waitlist")}{waiting > 0 && <span className="ml-1 rounded-full bg-ai/15 px-1.5 text-[11px] font-semibold text-ai">{waiting}</span>}</LinkButton>
            <div className="flex rounded-[10px] border border-border bg-surface p-0.5 shadow-card">
              {(["day", "week"] as const).map((v) => (
                <Link key={v} href={q({ view: v })} className={cx("rounded-lg px-3 py-1.5 text-[13px] capitalize", view === v ? "bg-subtle font-medium" : "text-muted")}>{v === "day" ? t("day") : t("week")}</Link>
              ))}
            </div>
            <LinkButton href={q({ date: addDays(anchor, view === "week" ? -7 : -1) })} variant="secondary" aria-label={t("Previous")}><Icon name="chevronLeft" /></LinkButton>
            <LinkButton href={q({ date: today })} variant="secondary">{t("Today")}</LinkButton>
            <LinkButton href={q({ date: addDays(anchor, view === "week" ? 7 : 1) })} variant="secondary" aria-label={t("Next")}><Icon name="chevronRight" /></LinkButton>
            <LinkButton href={q({ block: "1" })} variant="secondary" icon="clock">{t("Not available")}</LinkButton>
            <LinkButton href={q({ new: "1" })} icon="plus">{t("New booking")}</LinkButton>
          </>
        }
      />

      {pending.length > 0 && (
        <Card className="mb-4 border-warn/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-[14px] font-semibold"><Icon name="clock" size={16} className="text-warn" /> {t(pending.length > 1 ? "{n} booking requests to confirm" : "{n} booking request to confirm", { n: pending.length })}</div>
          <div className="flex flex-wrap gap-2">
            {pending.slice(0, 6).map((b) => (
              <Link key={b.id} href={q({ focus: b.id, date: zonedParts(b.startsAt, tz).date })} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] hover:bg-subtle">
                {b.customer.name} · {fmtDay(zonedParts(b.startsAt, tz).date, tz)} {formatTime(b.startsAt, tz)}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px]">
        <Link href={q({ staff: undefined }).replace(/&?staff=[^&]*/, "")} className={cx("rounded-full border px-3 py-1", !sp.staff ? "border-fg bg-fg text-bg" : "border-border text-muted")}>{t("Everyone")}</Link>
        {staff.filter((s) => s.active).map((s) => (
          <Link key={s.id} href={q({ staff: s.id })} className={cx("flex items-center gap-1.5 rounded-full border px-3 py-1", sp.staff === s.id ? "border-fg bg-fg text-bg" : "border-border text-muted")}>
            <span className="size-2 rounded-full" style={{ background: s.color }} /> {s.name}
          </Link>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <div className="grid min-w-[760px]" style={{ gridTemplateColumns: `56px repeat(${columns.length}, minmax(0,1fr))` }}>
          <div className="border-b border-border" />
          {columns.map((c) => (
            <div key={c.key} className={cx("border-b border-l border-border px-3 py-2.5 text-[13px]", c.date === today && view === "week" && "bg-ai/5")}>
              {view === "week" ? (
                <Link href={q({ view: "day", date: c.date })} className="font-medium hover:underline">{fmtDay(c.date, tz)}</Link>
              ) : (
                <span className="font-medium">{c.label}</span>
              )}
              <span className="ml-1.5 text-faint">{c.items.length || ""}</span>
            </div>
          ))}
          <div className="relative" style={{ height: (END_HOUR - START_HOUR) * 60 * PX_PER_MIN }}>
            {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
              <div key={i} className="absolute right-2 -translate-y-1/2 text-[11px] text-faint tabular-nums" style={{ top: i * 60 * PX_PER_MIN }}>{i ? minutesToHHMM((START_HOUR + i) * 60) : ""}</div>
            ))}
          </div>
          {columns.map((c) => (
            <div key={c.key} className="relative border-l border-border" style={{ height: (END_HOUR - START_HOUR) * 60 * PX_PER_MIN }}>
              {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                <div key={i} className="absolute inset-x-0 border-t border-border/60" style={{ top: i * 60 * PX_PER_MIN }} />
              ))}
              {offsFor(c).map(({ o, from, to }) => {
                const top = Math.max(0, (from - START_HOUR * 60) * PX_PER_MIN);
                const bottom = Math.min((END_HOUR - START_HOUR) * 60 * PX_PER_MIN, (to - START_HOUR * 60) * PX_PER_MIN);
                if (bottom <= top) return null;
                return (
                  <Link key={o.id} href={q({ off: o.id })} scroll={false} className="absolute inset-x-1 overflow-hidden rounded-lg border border-border/80 px-2 py-1 text-[11px] leading-tight text-muted hover:z-10" style={{ top, height: Math.max(18, bottom - top - 2), background: "repeating-linear-gradient(135deg, var(--color-subtle) 0 6px, transparent 6px 12px)" }}>
                    <span className="font-medium">{t(o.reason || "Not available")}</span>{view === "week" && o.staffId ? ` · ${staffName.get(o.staffId) ?? ""}` : ""}
                  </Link>
                );
              })}
              {c.items.map((b) => <Block key={b.id} b={b} tz={tz} href={q({ focus: b.id })} />)}
            </div>
          ))}
        </div>
      </Card>

      {sp.new && <NewBookingDrawer close={q({ new: undefined }).replace(/&?new=1/, "")} services={services} staff={staff} customers={await listCustomers(tenant.business.id)} date={anchor} />}
      {sp.block && <BlockTimeDrawer close={q({}).replace(/&?block=[^&]*/, "")} staff={staff} date={anchor} staffId={sp.staff} />}
      {sp.off && (() => {
        const o = offs.find((x) => x.id === sp.off);
        return o ? <OffDrawer o={o} tz={tz} who={o.staffId ? (staffName.get(o.staffId) ?? "") : t("Everyone (whole business)")} close={q({}).replace(/&?off=[^&]*/, "")} /> : null;
      })()}
      {focus && <BookingDrawer b={focus} tz={tz} currency={tenant.business.currency} close={q({}).replace(/&?focus=[^&]*/, "")} staff={staff} />}
    </>
  );
}

function fmtDay(date: string, tz: string, long = false) {
  return new Intl.DateTimeFormat(requestIntlLocale(), { timeZone: "UTC", weekday: long ? "long" : "short", day: "numeric", month: long ? "long" : "short" }).format(new Date(`${date}T12:00:00Z`));
}

function Block({ b, tz, href }: { b: BookingRow; tz: string; href: string }) {
  const { minute } = zonedParts(b.startsAt, tz);
  const top = Math.max(0, (minute - START_HOUR * 60) * PX_PER_MIN);
  const height = Math.max(24, ((b.endsAt.getTime() - b.startsAt.getTime()) / 60000) * PX_PER_MIN - 2);
  return (
    <Link
      href={href}
      scroll={false}
      className={cx("absolute inset-x-1 overflow-hidden rounded-lg border px-2 py-1 text-[12px] leading-tight shadow-card transition hover:z-10 hover:shadow-pop", b.status === "pending" ? "border-dashed border-warn bg-warn/10" : "border-border bg-surface", (b.status === "no_show" || b.status === "completed") && "opacity-60")}
      style={{ top, height, borderLeft: `3px solid ${b.staff.color}` }}
    >
      <div className="font-semibold tabular-nums">{formatTime(b.startsAt, tz)} <span className="font-normal text-muted">{b.customer.name}</span></div>
      <div className="truncate text-muted">{b.service.name}</div>
    </Link>
  );
}

async function Drawer({ title, close, children }: { title: string; close: string; children: React.ReactNode }) {
  const t = await getT();
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <Link href={close} scroll={false} className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" aria-label={t("Close")} />
      <div className="animate-fade-up relative h-full w-full max-w-md overflow-y-auto border-l border-border bg-surface p-6 shadow-pop">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">{title}</h2>
          <Link href={close} scroll={false} className="rounded-md p-1 text-muted hover:bg-subtle"><Icon name="x" /></Link>
        </div>
        {children}
      </div>
    </div>
  );
}

async function BookingDrawer({ b, tz, currency, close, staff }: { b: Awaited<ReturnType<typeof getBookingRow>>; tz: string; currency: string; close: string; staff: { id: string; name: string }[] }) {
  const t = await getT();
  const live = b.status === "pending" || b.status === "confirmed";
  const { date, minute } = zonedParts(b.startsAt, tz);
  return (
    <Drawer title={b.customer.name} close={close}>
      <div className="flex items-center gap-2">
        <Badge tone={BOOKING_TONE[b.status]}>{t(BOOKING_LABEL[b.status])}</Badge>
        <Badge>{b.source === "agent" || b.source === "whatsapp" || b.source === "telegram" ? t("via agent ({source})", { source: b.source }) : t("via {source}", { source: t(b.source) })}</Badge>
      </div>
      <dl className="mt-5 space-y-3 text-[14px]">
        <Row k={t("Service")} v={`${b.service.name} · ${b.service.durationMinutes} min`} />
        <Row k={t("When")} v={`${fmtDay(date, tz, true)}, ${formatTime(b.startsAt, tz)}`} />
        <Row k={t("With")} v={b.staff.name} />
        <Row k={t("Price")} v={formatMoney(b.priceCents, currency)} />
        <Row k={t("Contact")} v={[b.customer.phone, b.customer.email].filter(Boolean).join(" · ") || "—"} />
        {b.notes && <Row k={t("Notes")} v={b.notes} />}
        {b.cancelReason && <Row k={t("Cancel reason")} v={b.cancelReason} />}
      </dl>
      <div className="mt-3 flex flex-wrap gap-4">
        <Link href={`/app/customers/${b.customer.id}`} className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-fg">{t("Customer profile")} <Icon name="arrowRight" size={14} /></Link>
        {b.status !== "cancelled" && b.priceCents > 0 && <Link href={`/app/invoices/new?booking=${b.id}`} className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-fg"><Icon name="file" size={14} /> {t("Create invoice")}</Link>}
      </div>

      {live && (
        <>
          <form action={bookingAction} className="mt-6 flex flex-wrap gap-2">
            <input type="hidden" name="bookingId" value={b.id} />
            {b.status === "pending" && <Button name="action" value="confirm" icon="check">{t("Confirm")}</Button>}
            {b.startsAt < new Date() && <Button name="action" value="complete" variant="secondary">{t("Mark completed")}</Button>}
            {b.startsAt < new Date() && <Button name="action" value="no_show" variant="secondary">{t("No-show")}</Button>}
          </form>

          <div className="mt-6 border-t border-border pt-5">
            <div className="mb-3 text-[14px] font-semibold">{t("Reschedule")}</div>
            <ActionForm action={rescheduleAction} className="space-y-3">
              <input type="hidden" name="bookingId" value={b.id} />
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("Date")}><Input type="date" name="date" defaultValue={date} required /></Field>
                <Field label={t("Time")}><Input type="time" name="time" step={300} defaultValue={minutesToHHMM(minute)} required /></Field>
              </div>
              <Field label={t("With")}>
                <Select name="staffId" defaultValue={b.staff.id}>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
              </Field>
              <Toggle name="override" label={t("Allow outside opening hours")} description={t("Overlaps are still blocked.")} />
              <SubmitButton variant="secondary">{t("Move booking")}</SubmitButton>
            </ActionForm>
          </div>

          <form action={bookingAction} className="mt-6 space-y-3 border-t border-border pt-5">
            <input type="hidden" name="bookingId" value={b.id} />
            <input type="hidden" name="action" value="cancel" />
            <Field label={t("Cancel booking")}><Input name="reason" placeholder={t("Reason (shared with the customer)")} /></Field>
            <ConfirmSubmit message={t("Cancel this booking? The customer will be notified.")} icon="x">{t("Cancel booking")}</ConfirmSubmit>
          </form>
        </>
      )}
    </Drawer>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex gap-4"><dt className="w-28 shrink-0 text-muted">{k}</dt><dd className="min-w-0 break-words">{v}</dd></div>
);

async function NewBookingDrawer({ close, services, staff, customers, date }: { close: string; services: { id: string; name: string; durationMinutes: number }[]; staff: { id: string; name: string; active: boolean }[]; customers: { id: string; name: string; phone: string | null }[]; date: string }) {
  const t = await getT();
  return (
    <Drawer title={t("New booking")} close={close}>
      {!services.length ? (
        <p className="text-muted">{t("Add a service first.")} <Link className="underline" href="/app/services">{t("Services")}</Link></p>
      ) : (
        <ActionForm action={createBookingAction} className="space-y-4" resetOnSuccess>
          <Field label={t("Service")}>
            <Select name="serviceId" required>{services.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.durationMinutes} min</option>)}</Select>
          </Field>
          <Field label={t("With")}>
            <Select name="staffId" defaultValue=""><option value="">{t("First available")}</option>{staff.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Date")}><Input type="date" name="date" defaultValue={date} required /></Field>
            <Field label={t("Time")}><Input type="time" name="time" step={300} defaultValue="10:00" required /></Field>
          </div>
          <Field label={t("Existing customer")} hint={t("or fill in below")}>
            <Select name="customerId" defaultValue=""><option value="">{t("New customer")}</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}</Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Name")}><Input name="name" /></Field>
            <Field label={t("Phone")}><Input name="phone" type="tel" /></Field>
          </div>
          <Field label={t("Email")}><Input name="email" type="email" /></Field>
          <Field label={t("Notes")}><Textarea name="notes" rows={2} /></Field>
          <Toggle name="override" label={t("Walk-in / override hours")} description={t("Book outside published slots. Overlaps are still blocked.")} />
          <SubmitButton className="w-full">{t("Create booking")}</SubmitButton>
        </ActionForm>
      )}
    </Drawer>
  );
}

async function BlockTimeDrawer({ close, staff, date, staffId }: { close: string; staff: { id: string; name: string; active: boolean }[]; date: string; staffId?: string }) {
  const t = await getT();
  return (
    <Drawer title={t("Block time (not available)")} close={close}>
      <p className="mb-4 text-[14px] text-muted">{t("Lunch, a break, an errand… Nobody can book those hours: not customers, not your assistant. Bookings already there are kept.")}</p>
      <ActionForm action={blockTimeAction} className="space-y-4" resetOnSuccess>
        <Field label={t("Reason")}>
          <Select name="reason" defaultValue="Lunch">
            <option value="Lunch">{t("Lunch")}</option>
            <option value="Break">{t("Break")}</option>
            <option value="Personal">{t("Personal")}</option>
            <option value="other">{t("Other…")}</option>
          </Select>
        </Field>
        <Field label={t("Other reason")} hint={t("optional")}><Input name="reasonText" maxLength={80} placeholder={t("e.g. Doctor")} /></Field>
        <Field label={t("Date")}><Input type="date" name="date" defaultValue={date} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("From")}><Input type="time" name="from" step={300} defaultValue="14:00" required /></Field>
          <Field label={t("To")}><Input type="time" name="to" step={300} defaultValue="15:00" required /></Field>
        </div>
        <Field label={t("Who")}>
          <Select name="staffId" defaultValue={staffId ?? ""}>
            <option value="">{t("Everyone (whole business)")}</option>
            {staff.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        <Field label={t("Repeat")}>
          <Select name="repeat" defaultValue="none">
            <option value="none">{t("Only this day")}</option>
            <option value="daily">{t("Every day for the next 7 days")}</option>
            <option value="weekly">{t("Same weekday for the next 8 weeks")}</option>
          </Select>
        </Field>
        <p className="text-[12px] text-faint">{t("For a break every day, you can also set it once in Team & hours.")}</p>
        <SubmitButton className="w-full" icon="clock">{t("Block time")}</SubmitButton>
      </ActionForm>
    </Drawer>
  );
}

async function OffDrawer({ o, tz, who, close }: { o: { id: string; startsAt: Date; endsAt: Date; reason: string }; tz: string; who: string; close: string }) {
  const t = await getT();
  const s0 = zonedParts(o.startsAt, tz);
  const e0 = zonedParts(o.endsAt, tz);
  return (
    <Drawer title={t(o.reason || "Not available")} close={close}>
      <dl className="space-y-3 text-[14px]">
        <Row k={t("From")} v={`${fmtDay(s0.date, tz, true)}, ${formatTime(o.startsAt, tz)}`} />
        <Row k={t("To")} v={`${fmtDay(e0.date, tz, true)}, ${formatTime(o.endsAt, tz)}`} />
        <Row k={t("Who")} v={who} />
      </dl>
      <form action={unblockTimeAction} className="mt-6">
        <input type="hidden" name="id" value={o.id} />
        <ConfirmSubmit message={t("Make this time available again?")} variant="secondary" icon="trash">{t("Remove block")}</ConfirmSubmit>
      </form>
    </Drawer>
  );
}
