"use client";

import { Settings2 } from "lucide-react";
import { useConsent } from "./cookie-consent-provider";
import { useCookieTexts } from "./cookie-consent-i18n";

/**
 * Button/link that re-opens the cookie preferences modal.
 * Meant to be used in the footer and in the /legal/cookies page so users can
 * change their choices at any time (RGPD right to withdraw consent).
 */
export function ManageCookiesLink({
  variant = "link",
  className = "",
}: {
  variant?: "link" | "button";
  className?: string;
}) {
  const t = useCookieTexts();
  const { reopen } = useConsent();

  if (variant === "button") {
    return (
      <button
        onClick={reopen}
        className={
          className ||
          "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md ring-1 ring-neutral-300 dark:ring-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        }
      >
        <Settings2 className="h-4 w-4" />
        {t.manage}
      </button>
    );
  }

  return (
    <button
      onClick={reopen}
      className={
        className ||
        "text-neutral-600 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-300"
      }
    >
      {t.manage}
    </button>
  );
}
