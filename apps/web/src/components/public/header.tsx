import { getT } from "@/i18n/server";
import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { isPlatformRole } from "@/lib/platform-rbac";
import { LinkButton, Logo } from "../ui";
import { LocaleSwitcher } from "../locale-switcher";

export async function PublicHeader() {
  const t = await getT();
  const user = await currentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/"><Logo /></Link>
        <nav className="hidden items-center gap-5 text-[14px] text-muted sm:flex">
          <Link href="/discover" className="hover:text-fg">{t("Discover")}</Link>
          <Link href="/#business" className="hover:text-fg">{t("For businesses")}</Link>
          <Link href="/#pricing" className="hover:text-fg">{t("Pricing")}</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <LinkButton href={isPlatformRole(user.platformRole) ? "/admin" : "/app"} size="sm">{t("Open workspace")}</LinkButton>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">{t("Sign in")}</LinkButton>
              <LinkButton href="/signup" size="sm">{t("List your business")}</LinkButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export async function PublicFooter() {
  const t = await getT();
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo />
        <div className="flex flex-wrap gap-5">
          <Link href="/discover" className="hover:text-fg">{t("Discover")}</Link>
          <Link href="/signup" className="hover:text-fg">{t("For businesses")}</Link>
          <Link href="/privacy" className="hover:text-fg">{t("Privacy")}</Link>
          <span>© {new Date().getFullYear()} AIBA</span>
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  );
}
