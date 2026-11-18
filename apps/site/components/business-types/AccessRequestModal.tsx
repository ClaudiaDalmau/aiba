"use client";

/**
 * Access-request modal for the SENSITIVE vertical (red-umbrella "Otros
 * profesionales"). Requires verification data since this segment needs manual
 * admin approval before an invite code is issued:
 *   - Professional name
 *   - Phone
 *   - Contact email
 *   - Website URL AND/OR at least one ad-portal link (proof of activity)
 *
 * Submits to POST /api/invites/request (extended). The admin later reviews it
 * and issues a private AIB-PRIV-2026-XX code that unlocks the sensitive
 * vertical during registration.
 */
import { useEffect, useState } from "react";
import { X, Loader2, ShieldCheck, Plus, Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  locale: string;
  labels: {
    accessTitle: string;
    accessSubtitle: string;
    accessProfPh: string;
    accessPhonePh: string;
    accessEmailPh: string;
    accessWebsitePh: string;
    accessPortalPh: string;
    accessCta: string;
    accessSuccess: string;
    close: string;
    fieldRequired: string;
    emailInvalid: string;
    urlHint: string;
  } & Record<string, string>;
};

export default function AccessRequestModal({ open, onClose, locale, labels }: Props) {
  const [profName, setProfName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [portalLinks, setPortalLinks] = useState<string[]>([""]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setProfName(""); setPhone(""); setEmail("");
      setWebsite(""); setPortalLinks([""]);
      setSubmitting(false); setDone(false); setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  const addPortal = () => setPortalLinks((prev) => [...prev, ""]);
  const removePortal = (i: number) => setPortalLinks((prev) => prev.filter((_, idx) => idx !== i));
  const updatePortal = (i: number, v: string) =>
    setPortalLinks((prev) => prev.map((p, idx) => (idx === i ? v : p)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!profName.trim() || !email.trim() || !phone.trim()) { setError(labels.fieldRequired); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError(labels.emailInvalid); return; }
    // Require at least ONE valid URL (website or portal).
    const websiteClean = website.trim();
    const portalsClean = portalLinks.map((p) => p.trim()).filter(Boolean);
    if (!websiteClean && portalsClean.length === 0) {
      setError(labels.urlHint);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/invites/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          full_name: profName.trim(),
          activity: "sensitive_vertical",   // marker for admin
          phone: phone.trim(),
          website: websiteClean || null,
          portal_links: portalsClean,
          message: [
            websiteClean ? `Web: ${websiteClean}` : "",
            portalsClean.length ? `Portales: ${portalsClean.join(" | ")}` : "",
          ].filter(Boolean).join("\n"),
          referral: `sensitive_signup_${locale}`,
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
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl ring-1 ring-neutral-200 dark:ring-neutral-800 overflow-hidden max-h-[92vh] overflow-y-auto">
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
              <ShieldCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {labels.accessSuccessTitle}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{labels.accessSuccess}</p>
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
              {labels.accessKicker}
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {labels.accessTitle}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              {labels.accessSubtitle}
            </p>

            <div className="space-y-3">
              <input
                type="text" value={profName} onChange={(e) => setProfName(e.target.value)}
                placeholder={labels.accessProfPh}
                className="w-full px-3 py-2.5 rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                autoFocus
              />
              <input
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder={labels.accessPhonePh}
                className="w-full px-3 py-2.5 rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={labels.accessEmailPh}
                className="w-full px-3 py-2.5 rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <input
                type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
                placeholder={labels.accessWebsitePh}
                className="w-full px-3 py-2.5 rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />

              <div className="pt-2">
                <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2 uppercase tracking-wider">
                  {labels.portalsLabel}
                </div>
                {portalLinks.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <input
                      type="url" value={p} onChange={(e) => updatePortal(i, e.target.value)}
                      placeholder={labels.accessPortalPh}
                      className="flex-1 px-3 py-2.5 rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    {portalLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePortal(i)}
                        className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        aria-label={labels.removeAriaLabel}
                      >
                        <Trash2 className="h-4 w-4 text-neutral-500" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPortal}
                  className="inline-flex items-center gap-1 text-xs text-violet-700 dark:text-violet-400 hover:text-violet-800 font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" /> {labels.addPortal}
                </button>
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-2 leading-relaxed">
                {labels.urlHint}
              </p>
            </div>

            {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold rounded-md transition-colors"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {labels.accessCta}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
