"use client";
import { ForumAuthor } from "@/lib/forum-api";
import { ShieldCheck, Crown, Sparkles, Award } from "lucide-react";

/**
 * Renders a compact author "card" (avatar + name + badges).
 * Badges shown:
 *   - `Admin`  → admins have final say
 *   - `KYC`    → identity-verified pros
 *   - `VIP`    → premium plan
 *   - `Top`    → provided by `topBadge` prop (backend computes ranking)
 */
export default function AuthorCard({
  author,
  compact = false,
  topBadge,
}: {
  author: ForumAuthor & { top_badge?: "top1" | "top10" };
  compact?: boolean;
  topBadge?: "top1" | "top10" | null;
}) {
  // Backend enriches `author.top_badge` on list_posts / get_post responses.
  // Prop `topBadge` still supported for callers that want to override.
  const effectiveBadge = topBadge ?? author.top_badge ?? null;
  const initials = (author.business_name || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const size = compact ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-xs";

  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "mb-2"}`}>
      <div className={`${size} rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold`}>
        {initials}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`font-semibold truncate ${compact ? "text-xs" : "text-sm"}`}>
            {author.business_name}
          </span>
          {author.is_admin && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
              <ShieldCheck className="h-2.5 w-2.5" /> Admin
            </span>
          )}
          {author.verified && !author.is_admin && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <ShieldCheck className="h-2.5 w-2.5" /> KYC
            </span>
          )}
          {author.plan === "premium" && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Crown className="h-2.5 w-2.5" /> VIP
            </span>
          )}
          {effectiveBadge === "top1" && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300">
              <Sparkles className="h-2.5 w-2.5" /> Top #1
            </span>
          )}
          {effectiveBadge === "top10" && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Award className="h-2.5 w-2.5" /> Top 10
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
