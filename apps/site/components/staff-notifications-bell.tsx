"use client";

/**
 * Staff notifications badge (Iter93) — polls
 * /api/admin/moderator/notifications with a `since` cursor persisted in
 * localStorage. Shows a small bell + red dot with total count.
 *
 * Client-side only; renders `null` when the user is not staff (the
 * parent app-shell decides based on the SessionUser role).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Loader2, X, Flag, Star, MessageCircle, UserCog } from "lucide-react";

type Notif = {
  generated_at: string;
  latest_at: string;
  unread_total: number;
  breakdown: {
    pending_reports: number;
    pending_reports_total: number;
    low_pilot_feedback: number;
    forum_actions: number;
    role_changes: number;
  };
};

const CURSOR_KEY = "aib.staff.notif.cursor";
const SOUND_KEY = "aib.staff.notif.sound";
const LAST_TOTAL_KEY = "aib.staff.notif.last_total";
const POLL_MS = 30_000;

/**
 * Data-URI of a tiny (~1.5 KB), gentle two-tone WAV that acts as our
 * "new priority item" beep. Kept inline to avoid an extra network hop.
 */
const BEEP_DATA_URI =
  "data:audio/wav;base64,UklGRvQCAABXQVZFZm10IBAAAAABAAEAgD4AAADwAABAAgAQAGRhdGHQAgAAAAAcCzcVUB5oJnkta" +
  "TNPOB08zj51PggwsymGIiUYuxL5Cs4C7fhk8QvsmuMR3ijaBdQC0EPRZtHy1efZVeI365LxIvxrBTsQERjKICMoNy5VNP03zjnq" +
  "OeE3MzP7LZQmSh9jFuANqQP7+dLwrOh35gLg2NsB2XjZmtl+3XniZOjs8Wr7wASxDlEXkyCXJ58t0jI0N/o5AjqwOEE0oy+MJyEg" +
  "IhbrDaEDGvpP8QvpBebU36LcVdjT2QjaOd614WLo9PGb+9wEyw5aF5cgnyfmLdMyMzcNOgs6xTgnNJcvcyclHxEW1w1cA7v5DPD3" +
  "5+HmVN9E24rY4dj12qHevOMj6vzy0PtsBWwPQhixIL4nDS4kM4Q3ITr5OZM4JzOhLoQmwR/QFcENjAOu+aXwjOh35p3fNNsL2LrZ" +
  "kNlB3rrjR+of8/D7bwXHDkYXjyCcJ+ct1jI2NxA6DzrEODEzsy93J8oe7RXVDbID3Pnp8Kfoc+YR4NHb9tj/2FTZzt4/5AzrLPP7" +
  "+2sFcQ9NGKAgpicwLg8znTdCOgQ6mzhaM50uZybGH9UVpg1LA6H5U/Bd6C7mE+Cw24TYSNll2WneuePs6urybPy1BXQPkxfxIH8n" +
  "PC5MMwc4KzobOscziS5FJs4frxWCDS0Dsvks8CToDeYZ4LzbjNjL2FvZbt5o5B7rl/JI/JcFyw+iF/wgnyd/LmsxOTg4Ohw6xzMk" +
  "LzIm2R+3FYINDANs+RTw/eeh5W3gwtuS2N7YZtly3ivrufI0/PgFyg+cGP4gvie6Lo0wODhOOhU6xzO/LwYm4B/AFYINtwOw+RXw" +
  "GugC5inguducG+PY9Nk+3nvkAeuv8kn8VgbLD5EY/CDMJ7Yumy5POCw6Bzq5MzYvBSbwH8UVaw0iA4L5D/Ap6BXmi9/72KLZi9pE" +
  "3zPle+3184z8CQb1D5UY9CD/J50u9C7oOA46szO5LxAmzB/CFYUNAgOs+STw3+gd5uH+";

const playBeep = (() => {
  let audio: HTMLAudioElement | null = null;
  return () => {
    try {
      if (!audio) {
        audio = new Audio(BEEP_DATA_URI);
        audio.volume = 0.4;
      }
      audio.currentTime = 0;
      const p = audio.play();
      if (p) p.catch(() => { /* browsers block autoplay; ignore */ });
    } catch {
      // silent
    }
  };
})();

export default function StaffNotificationsBell() {
  const [data, setData] = useState<Notif | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const soundRef = useRef<boolean>(false);
  const firstLoadRef = useRef<boolean>(true);
  const dropRef = useRef<HTMLDivElement | null>(null);

  // Read persisted sound pref once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SOUND_KEY);
      const on = raw === "1";
      setSoundOn(on);
      soundRef.current = on;
    } catch {
      // no-op
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let cursor: string | null = null;
      try {
        cursor = localStorage.getItem(CURSOR_KEY);
      } catch {
        cursor = null;
      }
      cursorRef.current = cursor;
      const params = new URLSearchParams();
      if (cursor) params.set("since", cursor);
      const r = await fetch(
        `/api/backend/admin/moderator/notifications${params.toString() ? "?" + params.toString() : ""}`,
        { cache: "no-store" },
      );
      if (r.ok) {
        const next: Notif = await r.json();
        // Sound trigger: only beep if we've already loaded at least once
        // and the total went up. Prevents an initial beep on page load.
        if (soundRef.current && !firstLoadRef.current) {
          let lastTotal = 0;
          try {
            lastTotal = parseInt(localStorage.getItem(LAST_TOTAL_KEY) || "0", 10) || 0;
          } catch {
            lastTotal = 0;
          }
          if (next.unread_total > lastTotal) playBeep();
        }
        try { localStorage.setItem(LAST_TOTAL_KEY, String(next.unread_total)); } catch { /* ignore */ }
        firstLoadRef.current = false;
        setData(next);
      }
    } catch {
      // silent — badge failure never breaks the UI
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => { void load(); }, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Click-outside to close dropdown.
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const markAllRead = () => {
    try {
      const now = new Date().toISOString();
      localStorage.setItem(CURSOR_KEY, now);
    } catch {
      // localStorage disabled → silently no-op; poll cycle will still refresh counts.
    }
    setOpen(false);
    void load();
  };

  const total = data?.unread_total ?? 0;

  return (
    <div className="relative" ref={dropRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        aria-label="Notificaciones del staff"
      >
        <Bell className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-neutral-900">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 rounded-lg ring-1 ring-neutral-200 dark:ring-neutral-800 bg-white dark:bg-neutral-900 shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Bell className="h-4 w-4 text-violet-600" /> Bandeja del staff
            </p>
            <button onClick={() => setOpen(false)} className="p-1 -mr-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded" aria-label="Cerrar">
              <X className="h-3.5 w-3.5 text-neutral-400" />
            </button>
          </div>

          {loading && !data ? (
            <div className="p-6 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
              <NotifRow
                href="/admin/reports"
                icon={Flag}
                label="Reportes pendientes"
                sub={`${data?.breakdown.pending_reports_total ?? 0} sin resolver`}
                badge={data?.breakdown.pending_reports ?? 0}
                onNavigate={() => setOpen(false)}
              />
              <NotifRow
                href="/admin/pilot"
                icon={Star}
                label="Feedback piloto ≤ 2★"
                sub="Últimas 24h"
                badge={data?.breakdown.low_pilot_feedback ?? 0}
                onNavigate={() => setOpen(false)}
              />
              <NotifRow
                href="/forum"
                icon={MessageCircle}
                label="Acciones foro"
                sub="Ocultado / bloqueado / muted"
                badge={data?.breakdown.forum_actions ?? 0}
                onNavigate={() => setOpen(false)}
              />
              <NotifRow
                href="/admin/security"
                icon={UserCog}
                label="Cambios de rol"
                sub="Auditoría en tiempo real"
                badge={data?.breakdown.role_changes ?? 0}
                onNavigate={() => setOpen(false)}
              />
            </ul>
          )}

          <div className="px-3 py-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <Link
              href="/admin/moderator"
              onClick={() => setOpen(false)}
              className="text-xs text-violet-600 hover:underline font-semibold"
            >
              Ir al panel moderador →
            </Link>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-[11px] text-neutral-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={soundOn}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setSoundOn(on);
                    soundRef.current = on;
                    try { localStorage.setItem(SOUND_KEY, on ? "1" : "0"); } catch { /* ignore */ }
                    if (on) playBeep();
                  }}
                  className="h-3.5 w-3.5 rounded border-neutral-300 text-violet-600"
                />
                Sonido
              </label>
              <button
                onClick={markAllRead}
                disabled={total === 0}
                className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 disabled:opacity-50"
              >
                Marcar todo leído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotifRow({
  href, icon: Icon, label, sub, badge, onNavigate,
}: {
  href: string; icon: any; label: string; sub: string;
  badge: number; onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className="flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
      >
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-none ${
          badge > 0
            ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
        }`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{label}</p>
          <p className="text-[11px] text-neutral-500">{sub}</p>
        </div>
        {badge > 0 && (
          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Link>
    </li>
  );
}
