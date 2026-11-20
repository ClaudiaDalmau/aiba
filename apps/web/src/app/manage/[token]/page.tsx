import { requestIntlLocale } from "@/i18n/request-locale";
import { getT } from "@/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ManageBooking } from "@/components/public/manage-booking";
import { Badge, BOOKING_LABEL, BOOKING_TONE, Card, Input, Logo } from "@/components/ui";
import { ReviewForm, Stars } from "@/components/public/review-form";
import { customerNoAgreement } from "@/actions/manage";
import { ActionForm } from "@/components/workspace/action-form";
import { SubmitButton } from "@/components/client";
import { bookingByToken } from "@/lib/bookings";
import { reviewable, reviewForBooking } from "@/lib/reviews";
import { formatMoney, todayIn } from "@/lib/time";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Your booking"), robots: { index: false } };
}

export default async function ManagePage({ params }: { params: Promise<{ token: string }> }) {
  const t = await getT();
  const row = await bookingByToken((await params).token);
  if (!row) notFound();
  const { booking: b, business, service, staff } = row;
  const tz = business.timezone;
  const live = b.status === "pending" || b.status === "confirmed";
  const hoursLeft = (b.startsAt.getTime() - Date.now()) / 3600_000;
  const canChange = live && hoursLeft >= business.policy.cancellationWindowHours;
  const canReview = reviewable(b);
  const atDoor = live && Date.now() >= b.startsAt.getTime() - 30 * 60_000 && Date.now() <= b.endsAt.getTime() + 24 * 3600_000;
  const review = canReview ? await reviewForBooking(b.id) : null;
  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <Link href="/"><Logo /></Link>
      <Card className="mt-8 overflow-hidden">
        <div className="h-2" style={{ background: business.brandColor }} />
        <div className="p-6">
          <div className="flex items-center justify-between">
            <Link href={`/b/${business.slug}`} className="font-semibold hover:underline">{business.name}</Link>
            <Badge tone={BOOKING_TONE[b.status]}>{BOOKING_LABEL[b.status]}</Badge>
          </div>
          <h1 className="mt-4 text-[24px] font-semibold tracking-tight">{service.name}</h1>
          <p className="mt-1 text-muted">
            {new Intl.DateTimeFormat(requestIntlLocale(), { timeZone: tz, weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(b.startsAt)}
            <br />{t("with {name}", { name: staff.name })} · {formatMoney(b.priceCents, business.currency)}
          </p>
          {live && b.checkInCode && (
            <div className="mt-6 rounded-xl border border-border p-4 text-center">
              <div className="text-[12px] uppercase tracking-wider text-faint">{t("Your code for the appointment")}</div>
              <div className="mt-1 font-mono text-[28px] font-semibold tracking-[0.3em]">{b.checkInCode}</div>
              <p className="mt-1 text-[13px] text-muted">{t("Show it when you arrive so the visit is verified.")}</p>
            </div>
          )}
          {atDoor && (
            <ActionForm action={customerNoAgreement} className="mt-4 space-y-2 rounded-xl bg-subtle p-4">
              <input type="hidden" name="token" value={b.manageToken} />
              <div className="text-[14px] font-medium">{t("No agreement?")}</div>
              <p className="text-[13px] text-muted">{t("If you don't reach an agreement at the appointment, you can close it here without consequences for either side.")}</p>
              <Input name="reason" placeholder={t("Reason (optional, private)")} maxLength={300} />
              <SubmitButton size="sm" variant="secondary">{t("Close without agreement")}</SubmitButton>
            </ActionForm>
          )}
          {live && !canChange && <p className="mt-6 rounded-lg bg-subtle px-3 py-2 text-[13px] text-muted">{t("Changes are possible up to {h}h before. Please contact {name}.", { h: business.policy.cancellationWindowHours, name: business.phone ? `${business.name} (${business.phone})` : business.name })}</p>}
          <ManageBooking token={b.manageToken} slug={business.slug} serviceId={service.id} timezone={tz} today={todayIn(tz)} canChange={canChange} brand={business.brandColor} />
          {canReview && !review && <ReviewForm token={b.manageToken} brand={business.brandColor} businessName={business.name} />}
          {review && (
            <div id="review" className="mt-6 rounded-xl bg-subtle p-4 text-[14px]">
              <div className="flex items-center gap-2 font-medium">{t("Your review")} <Stars value={review.rating} color={business.brandColor} /></div>
              {review.comment && <p className="mt-1 text-muted">{review.comment}</p>}
              {review.reply && <p className="mt-3 border-l-2 border-border pl-3 text-muted"><span className="font-medium text-fg">{business.name}:</span> {review.reply}</p>}
            </div>
          )}
        </div>
      </Card>
    </main>
  );
}
