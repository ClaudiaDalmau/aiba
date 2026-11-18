import { getT } from "@/i18n/server";
import { replyReviewAction, toggleReviewAction } from "@/actions/reviews";
import { SubmitButton } from "@/components/client";
import { Stars } from "@/components/public/review-form";
import { Badge, Card, Empty, PageHeader, Stat } from "@/components/ui";
import { businessRating, listReviews } from "@/lib/reviews";
import { currentTenant } from "@/lib/tenant";
import { formatDate } from "@/lib/time";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Reviews") };
}

export default async function ReviewsPage() {
  const t = await getT();
  const tenant = await currentTenant();
  const [rows, rating] = await Promise.all([listReviews(tenant.business.id), businessRating(tenant.business.id)]);
  const pending = rows.filter((r) => !r.review.reply && !r.review.hidden).length;
  return (
    <>
      <PageHeader
        title={t("Reviews")}
        description={t("Customers can review an appointment once it has taken place. When you mark a booking as completed they get a link by email and chat. Visible reviews appear on your booking page.")}
      />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat label={t("Average rating")} value={rating.average ? <span className="flex items-center gap-2">{rating.average.toFixed(1)} <Stars value={rating.average} size={18} /></span> : "—"} icon="sparkles" tone="ai" />
        <Stat label={t("Published reviews")} value={rating.count} icon="chat" />
        <Stat label={t("Waiting for your reply")} value={pending} icon="inbox" />
      </div>
      {rows.length === 0 ? (
        <Card><Empty icon="chat" title={t("No reviews yet")}>{t("Mark appointments as completed to invite customers to leave a review.")}</Empty></Card>
      ) : (
        <div className="space-y-4">
          {rows.map(({ review: r, service, staff, customer }) => (
            <Card key={r.id} className={r.hidden ? "p-5 opacity-60" : "p-5"}>
              <div className="flex flex-wrap items-center gap-2 text-[14px]">
                <Stars value={r.rating} size={16} />
                <span className="font-medium">{customer ?? r.authorName}</span>
                <span className="text-faint">· {formatDate(r.createdAt, tenant.business.timezone)}{service ? ` · ${service}` : ""}{staff ? ` · ${staff}` : ""}</span>
                {r.hidden && <Badge tone="warn">{t("Hidden")}</Badge>}
              </div>
              {r.comment ? <p className="mt-2 text-[14px]">{r.comment}</p> : <p className="mt-2 text-[13px] text-faint">{t("No comment")}</p>}
              <form action={replyReviewAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input type="hidden" name="id" value={r.id} />
                <textarea name="reply" defaultValue={r.reply} rows={2} maxLength={1500} placeholder={t("Write a public reply…")} className="min-h-10 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-[14px]" />
                <SubmitButton size="sm" variant="secondary">{r.reply ? t("Update reply") : t("Reply")}</SubmitButton>
              </form>
              <form action={toggleReviewAction} className="mt-2">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="hidden" value={r.hidden ? "false" : "true"} />
                <button className="text-[13px] text-muted underline-offset-2 hover:underline">{r.hidden ? t("Show on my page") : t("Hide from my page")}</button>
              </form>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
