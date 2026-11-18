import { getT } from "@/i18n/server";
import Link from "next/link";
import { Logo } from "@/components/ui";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between"><Link href="/"><Logo /></Link><LocaleSwitcher /></div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-[#0f0f12] p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute inset-0 opacity-60" style={{ background: "radial-gradient(60% 50% at 70% 30%, #6d28d9 0%, transparent 60%), radial-gradient(40% 40% at 20% 80%, #0ea5e9 0%, transparent 60%)" }} />
        <div className="relative max-w-md">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px]">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-emerald-400" /> {t("Your AI assistant is online")}
          </div>
          <p className="font-display text-[40px] leading-[1.1]">{t("“Book me in with Sami on Saturday morning?”")}</p>
          <p className="mt-4 text-white/70">{t("Every business gets its own assistant that answers on WhatsApp and Telegram, books real slots and knows when to hand over to you.")}</p>
        </div>
      </div>
    </div>
  );
}
