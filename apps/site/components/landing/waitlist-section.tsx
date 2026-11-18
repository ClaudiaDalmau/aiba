"use client";

// Waitlist section — client component with email capture.
// Calls POST /api/waitlist/subscribe and shows success state with position.
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle2, Users, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackEvent } from "@/lib/analytics";

const PROFESSIONS = [
  "beauty", "wellness", "fitness", "coaching", "health",
  "education", "creative", "professional", "home", "pets",
  "events", "hospitality", "other",
] as const;

const API_BASE = ""; // same-origin routes forward to the AIBA app

export default function WaitlistSection() {
  const t = useTranslations("home.waitlist");
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [profession, setProfession] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [total, setTotal] = useState<number>(0);

  // Fetch initial stats so we can show current waitlist count as social proof
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const r = await fetch(`${API_BASE}/api/waitlist/stats`, { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        if (!cancelled) setTotal(Number(d?.total || 0));
      } catch {
        // Silently ignore — the form still works without stats
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error(t("errorInvalidEmail"));
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/waitlist/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          locale,
          profession: profession || null,
          interest: "general",
        }),
      });
      if (!r.ok) {
        if (r.status === 429) {
          toast.error(t("errorRateLimit"));
          trackEvent("waitlist_submit_error", { reason: "rate_limit", locale });
        } else {
          const j = await r.json().catch(() => ({} as { detail?: string }));
          toast.error(j?.detail || t("errorGeneric"));
          trackEvent("waitlist_submit_error", { reason: "http_" + r.status, locale });
        }
        return;
      }
      const d = await r.json();
      setPosition(Number(d?.position || 0));
      setTotal(Number(d?.total || 0));
      setDone(true);
      if (d?.already_registered) {
        toast.info(t("alreadyRegistered"));
        trackEvent("waitlist_submit_already", { locale, profession: profession || "unset" });
      } else {
        toast.success(t("successToast"));
        trackEvent("waitlist_submit_success", {
          locale,
          profession: profession || "unset",
          position: Number(d?.position || 0),
        });
      }
    } catch {
      toast.error(t("errorNetwork"));
      trackEvent("waitlist_submit_error", { reason: "network", locale });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="waitlist"
      className="relative py-20 md:py-28 border-t border-neutral-200 dark:border-neutral-800 overflow-hidden"
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-violet-300/30 dark:bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-fuchsia-300/30 dark:bg-fuchsia-600/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-neutral-900/70 backdrop-blur ring-1 ring-violet-200 dark:ring-violet-900 text-violet-700 dark:text-violet-300 px-3 py-1 text-xs font-semibold mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          {t("badge")}
        </div>

        <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-4 leading-[1.1]">
          {t("title")}
        </h2>

        <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-8">
          {t("subtitle")}
        </p>

        {/* Social proof counter */}
        <div className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-8">
          <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <span>
            <strong className="text-neutral-900 dark:text-neutral-100">{total.toLocaleString(locale)}</strong>{" "}
            {t("counter")}
          </span>
        </div>

        {done ? (
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-violet-200 dark:border-violet-900 shadow-xl">
            <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {t("successTitle")}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
              {t("successDesc")}
            </p>
            {position ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 text-sm font-bold">
                {t("positionLabel")} #{position.toLocaleString(locale)}
              </div>
            ) : null}
          </div>
        ) : (
          <form onSubmit={onSubmit} className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  type="email"
                  required
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-12 text-base bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-base font-semibold transition-colors shadow-lg shadow-violet-600/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("submitting")}
                  </>
                ) : (
                  t("submit")
                )}
              </button>
            </div>

            <div className="max-w-md mx-auto">
              <Select value={profession} onValueChange={setProfession} disabled={loading}>
                <SelectTrigger className="w-full h-11 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                  <SelectValue placeholder={t("professionPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {PROFESSIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {t(`professions.${p}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-4 max-w-md mx-auto">
              {t("privacyNote")}
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
