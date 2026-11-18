"use client";

import { useState } from "react";
import { useT } from "@/i18n/client";
import { Button } from "../ui";

/** Star rating + comment, posted with the booking's manage token. */
export function ReviewForm({ token, brand, businessName }: { token: string; brand: string; businessName: string }) {
  const t = useT();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const labels = [t("Very poor"), t("Poor"), t("OK"), t("Good"), t("Excellent")];

  async function submit() {
    if (!rating) return setError(t("Choose from 1 to 5 stars"));
    setBusy(true);
    setError(null);
    const r = await fetch(`/api/v1/public/manage/${token}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "review", rating, comment }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setError(j.detail ?? t("Something went wrong"));
    setDone(true);
  }

  if (done) return <p className="mt-6 rounded-lg bg-ok/10 px-3 py-2 text-[14px] text-ok">{t("Thank you! Your review has been published.")}</p>;

  const shown = hover || rating;
  return (
    <div id="review" className="mt-6 rounded-xl border border-border p-4">
      <div className="font-semibold">{t("How was your visit to {name}?", { name: businessName })}</div>
      <div className="mt-3 flex items-center gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label={t("Rating")}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} · ${labels[n - 1]}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
            className="text-[30px] leading-none transition-transform hover:scale-110"
            style={{ color: n <= shown ? brand : "#d4d4d8" }}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-[13px] text-muted">{shown ? labels[shown - 1] : ""}</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1500}
        rows={3}
        placeholder={t("Tell others what you liked (optional)")}
        className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[14px] outline-none focus:border-fg/30"
      />
      {error && <p className="mt-2 text-[13px] text-bad">{error}</p>}
      <div className="mt-3"><Button onClick={submit} disabled={busy}>{busy ? t("Sending…") : t("Publish review")}</Button></div>
      <p className="mt-2 text-[12px] text-faint">{t("Your first name and last initial are shown with your review.")}</p>
    </div>
  );
}

export function Stars({ value, size = 14, color = "#f59e0b" }: { value: number; size?: number; color?: string }) {
  return (
    <span aria-label={`${value}/5`} className="inline-flex" style={{ fontSize: size, lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= Math.round(value) ? color : "#d4d4d8" }}>★</span>
      ))}
    </span>
  );
}
