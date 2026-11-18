"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, usePathname } from "@/i18n/navigation";

type Item = { href: string; label: string };

/** Menú desplegable para móvil y tablet (oculto a partir de lg). */
export default function MobileNav({
  items,
  loginLabel,
  ctaLabel,
  ctaHref,
  showLogin,
  menuLabel,
}: {
  items: Item[];
  loginLabel: string;
  ctaLabel: string;
  ctaHref: string;
  showLogin: boolean;
  menuLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pathname = usePathname();

  // Cierra al cambiar de página y bloquea el scroll del fondo mientras está abierto.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="aiba-mobile-menu"
        aria-label={menuLabel}
        className="relative grid h-9 w-9 place-items-center rounded-full text-white hover:bg-white/10 transition-colors"
      >
        <span className="sr-only">{menuLabel}</span>
        <span
          aria-hidden
          className={`absolute h-[1.5px] w-[18px] bg-current transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-[4px]"}`}
        />
        <span
          aria-hidden
          className={`absolute h-[1.5px] w-[18px] bg-current transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-[4px]"}`}
        />
      </button>

      {mounted && createPortal(
      <div
        id="aiba-mobile-menu"
        className={`fixed inset-x-0 top-14 bottom-0 z-[60] lg:hidden bg-[#050507]/95 backdrop-blur-xl transition-all duration-300 ${
          open ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
        }`}
      >
        <nav className="mx-auto flex h-full max-w-6xl flex-col px-6 pb-10 pt-6">
          <ul className="flex flex-col">
            {items.map((it, i) => (
              <li
                key={it.href}
                className={`border-b border-white/10 transition-all duration-500 ${open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}
                style={{ transitionDelay: open ? `${60 + i * 40}ms` : "0ms" }}
              >
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={it.href as any}
                  onClick={() => setOpen(false)}
                  className="block py-4 text-[26px] font-semibold tracking-[-0.02em] text-white hover:text-violet-300"
                >
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-3">
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={ctaHref as any}
              onClick={() => setOpen(false)}
              className="rounded-full bg-violet-600 py-3.5 text-center text-[17px] font-semibold text-white hover:bg-violet-500"
            >
              {ctaLabel}
            </Link>
            {showLogin && (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/25 py-3.5 text-center text-[17px] font-medium text-white hover:bg-white/10"
              >
                {loginLabel}
              </Link>
            )}
          </div>
        </nav>
      </div>
      , document.body)}
    </div>
  );
}
