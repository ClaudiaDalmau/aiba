"use client";

/**
 * Interactive business-type cards for the marketing "Tipos de negocio" page.
 *
 * Behaviour:
 * - Clicking any of the 9 "safe" sectors opens the standard `BusinessSignupModal`
 *   (personal + business data → subscribes the lead / redirects to /register).
 * - Clicking "other" (red-umbrella / sensitive vertical) opens `AccessRequestModal`
 *   which requires *verification data* (professional name, phone, email,
 *   website + ad-portal link) so the admin can manually approve them and issue
 *   a private invite code.
 *
 * The server-side page passes translated strings + case metadata as props so
 * this file doesn't need next-intl on the client. This keeps the interactive
 * bundle tiny while preserving SEO for the marketing page.
 */
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { RedUmbrellaIcon } from "@/components/icons/red-umbrella-icon";
import BusinessSignupModal from "./BusinessSignupModal";
import AccessRequestModal from "./AccessRequestModal";

export type BusinessTypeCase = {
  key: string;
  emoji: string;
  title: string;
  subtitle: string;
  benefits: string[];
};

type Props = {
  cases: BusinessTypeCase[];
  locale: string;
  labels: {
    // Signup modal
    signupTitle: string;
    signupSubtitle: string;
    signupNamePh: string;
    signupBusinessPh: string;
    signupEmailPh: string;
    signupPhonePh: string;
    signupWebsitePh: string;
    signupCta: string;
    signupSuccess: string;
    // Access request modal
    accessTitle: string;
    accessSubtitle: string;
    accessProfPh: string;
    accessPhonePh: string;
    accessEmailPh: string;
    accessWebsitePh: string;
    accessPortalPh: string;
    accessCta: string;
    accessSuccess: string;
    // Common
    close: string;
    fieldRequired: string;
    emailInvalid: string;
    urlHint: string;
    // Access modal extras
    accessKicker: string;
    portalsLabel: string;
    addPortal: string;
    accessSuccessTitle: string;
    removeAriaLabel: string;
  };
};

export default function BusinessTypeCards({ cases, locale, labels }: Props) {
  const [signupOpen, setSignupOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<BusinessTypeCase | null>(null);

  const onCardClick = (c: BusinessTypeCase) => {
    setSelectedCase(c);
    if (c.key === "other") setAccessOpen(true);
    else setSignupOpen(true);
  };

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((c, i, arr) => {
          const isLast = i === arr.length - 1;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onCardClick(c)}
              className={`text-left p-6 rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 hover:ring-violet-400 dark:hover:ring-violet-500 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer w-full ${
                isLast ? "md:col-span-2 lg:col-span-3" : ""
              }`}
              data-case={c.key}
            >
              <div className="text-4xl mb-4">
                {c.key === "other" ? <RedUmbrellaIcon size={44} /> : c.emoji}
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                {c.title}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">{c.subtitle}</p>
              <ul className="space-y-2">
                {c.benefits.map((b, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 dark:text-violet-400">
                  {c.key === "other" ? labels.accessCta : labels.signupCta} →
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <BusinessSignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        caseKey={selectedCase?.key ?? "health"}
        caseTitle={selectedCase?.title ?? ""}
        locale={locale}
        labels={labels}
      />
      <AccessRequestModal
        open={accessOpen}
        onClose={() => setAccessOpen(false)}
        locale={locale}
        labels={labels}
      />
    </>
  );
}
