import { cronAuthorized, sendDueReminders } from "@/lib/reminders";
import { notifyEndingReviewPeriods } from "@/lib/review-protocol";

/** Once-a-day scheduler (Vercel Hobby allows only daily crons): looks a full day further ahead. */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("forbidden", { status: 403 });
  const reminders = await sendDueReminders(24);
  const review = await notifyEndingReviewPeriods().catch((e) => ({ reviewError: String(e) }));
  return Response.json({ ...reminders, ...review });
}
