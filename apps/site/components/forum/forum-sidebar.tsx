"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hash, Bell, Search, VolumeX, Volume2, Users, Loader2,
} from "lucide-react";
import { listChannels, unreadSummary, muteChannel, unmuteChannel, type ForumChannel } from "@/lib/forum-api";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ForumSidebar() {
  const pathname = usePathname();
  const [channels, setChannels] = useState<ForumChannel[]>([]);
  const [mentions, setMentions] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [chs, un] = await Promise.all([listChannels(), unreadSummary()]);
      setChannels(chs.channels);
      setMentions(un.mentions);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Foro: " + msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 45000); // refresh every 45s
    return () => clearInterval(t);
  }, []);

  async function toggleMute(ch: ForumChannel, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (ch.muted) await unmuteChannel(ch.channel_id);
      else await muteChannel(ch.channel_id);
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Error: " + msg);
    }
  }

  return (
    <aside className="w-64 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-y-auto">
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800">
        <Link
          href="/forum/search"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-500 hover:bg-neutral-200"
        >
          <Search className="h-4 w-4" />
          <span>Buscar en el foro…</span>
        </Link>
      </div>

      <nav className="p-2 space-y-0.5">
        <Link
          href="/forum/mentions"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
            pathname === "/forum/mentions"
              ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
              : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
        >
          <Bell className="h-4 w-4" />
          <span className="flex-1">Menciones</span>
          {mentions > 0 && (
            <Badge className="h-5 min-w-[20px] px-1.5 bg-fuchsia-600 text-white text-[10px]">
              {mentions > 99 ? "99+" : mentions}
            </Badge>
          )}
        </Link>
      </nav>

      <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
        Canales
      </div>

      {loading ? (
        <div className="p-4 flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </div>
      ) : (
        <nav className="p-2 space-y-0.5">
          {channels.map((ch) => {
            const href = `/forum/${ch.channel_id}`;
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={ch.channel_id}
                href={href}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                    : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                } ${ch.muted ? "opacity-60" : ""}`}
              >
                <span className="text-base w-5 text-center">{ch.icon || "#"}</span>
                <span className="flex-1 truncate">{ch.name}</span>
                {ch.unread > 0 && !ch.muted && (
                  <Badge className="h-5 min-w-[20px] px-1.5 bg-violet-600 text-white text-[10px]">
                    {ch.unread > 99 ? "99+" : ch.unread}
                  </Badge>
                )}
                <button
                  onClick={(e) => toggleMute(ch, e)}
                  className="opacity-0 group-hover:opacity-100 transition text-neutral-400 hover:text-neutral-700"
                  title={ch.muted ? "Activar notificaciones" : "Silenciar canal"}
                >
                  {ch.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
              </Link>
            );
          })}
        </nav>
      )}

      <div className="px-4 py-4 mt-4 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500">
        <p className="flex items-center gap-1">
          <Users className="h-3 w-3" /> Comunidad privada AIB
        </p>
        <p className="mt-1 text-[10px] text-neutral-400">
          Solo pros verificadas KYC. Respeta el código de conducta.
        </p>
      </div>
    </aside>
  );
}
