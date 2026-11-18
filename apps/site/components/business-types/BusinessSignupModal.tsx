"use client";

/**
 * Signup modal for the 9 "safe" business sectors on the /tipos-de-negocio page.
 * Collects personal + business data and submits to /api/waitlist/subscribe
 * with the business_category set to the sector the user picked. On success,
 * the user is invited to complete registration in the main flow.
 */
import { useEffect, useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  caseKey: string;
  caseTitle: string;
  locale: string;
  labels: {
    signupTitle: string;
    signupSubtitle: string;
    signupNamePh: string;
    signupBusinessPh: string;
    signupEmailPh: string;
    signupPhonePh: string;
    signupWebsitePh: string;
    signupCta: string;
    signupSuccess: string;
    close: string;
    fieldRequired: string;
    emailInvalid: string;
  } & Record<string, string>;
};

export default function BusinessSignupModal({ open, onClose, caseKey, caseTitle, locale, labels }: Props) {
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state on open.
  useEffect(() => {
    if (open) {
      setName(""); setBusiness(""); setEmail(""); setPhone(""); setWebsite("");
      setSubmitting(false); setDone(false); setError(null);
    }
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !business.trim()) { setError(labels.fieldRequired); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError(labels.emailInvalid); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          full_name: name.trim(),
          business_name: business.trim(),
          business_category: caseKey,
          phone: phone.trim() || null,
          website: website.trim() || null,
          locale,
          source: `business_types_card_${caseKey}`,
        }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => "HTTP " + res.status));
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label={labels.close}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label={labels.close}
        >
          <X className="h-4 w-4 text-neutral-500" />
        </button>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{labels.signupSuccess}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-md transition-colors"
            >
              {labels.close}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">
              {caseTitle}
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {labels.signupTitle}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              {labels.signupSubtitle}
            </p>

            <div className="space-y-3">
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder={labels.signupNamePh}
                className="w-full px-3 py-2.5 rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                autoFocus
              />
              <input
                type="text" value={business} onChange={(e) => setBusiness(e.target.value)}
                placeholder={labels.signupBusinessPh}
                className="w-full px-3 py-2.5 rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={labels.signupEmailPh}
                className="w-full px-3 py-2.5 rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <input
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder={labels.signupPhonePh}
                className="w-full px-3 py-2.5 rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <input
                type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
                placeholder={labels.signupWebsitePh}
                className="w-full px-3 py-2.5 rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {labels.signupCta}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
