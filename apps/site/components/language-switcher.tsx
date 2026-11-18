"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { LOCALE_LABELS, routing } from "@/i18n/routing";
import { ChevronDown, Check } from "lucide-react";

// Reusable SVG flag component. Uses flagcdn.com (free, no key needed) which
// renders proper flags on ANY browser/OS (Chrome on Windows can't show emoji flags).
function Flag({ code, className = "" }: { code: string; className?: string }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      alt=""
      loading="lazy"
      className={`inline-block h-4 w-6 rounded-[2px] object-cover ring-1 ring-black/5 dark:ring-white/10 ${className}`}
    />
  );
}

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const current = LOCALE_LABELS[locale] ?? LOCALE_LABELS[routing.defaultLocale];

  const switchLocale = (next: string) => {
    setOpen(false);
    startTransition(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace(pathname as any, { locale: next as any });
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Flag code={current.countryCode} />
        <span className="hidden sm:inline">{current.native}</span>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            className="absolute right-0 mt-2 w-52 z-50 rounded-lg bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 shadow-lg py-1"
          >
            {routing.locales.map((l) => {
              const info = LOCALE_LABELS[l];
              const active = l === locale;
              return (
                <button
                  key={l}
                  onClick={() => switchLocale(l)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left ${
                    active
                      ? "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 font-medium"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  }`}
                  role="option"
                  aria-selected={active}
                >
                  <span className="flex items-center gap-2.5">
                    <Flag code={info.countryCode} />
                    <span>{info.native}</span>
                  </span>
                  {active && <Check className="h-4 w-4 text-violet-600" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
