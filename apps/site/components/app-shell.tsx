"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3, Calendar, CreditCard, Users, Wrench, Settings, Sparkles, Mail,
  LogOut, Menu, X, ShieldCheck, MessageCircle, Star, Users2, Gift, TrendingUp,
  Download, HelpCircle, Bell, Trophy, Receipt, UserCog, Cpu, Activity, Flag,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { GlobalSearch } from "@/components/global-search";
import StaffNotificationsBell from "@/components/staff-notifications-bell";
import type { SessionUser } from "@/lib/session";

type NavItem = { href: string; label: string; icon: any };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Analytics",  icon: BarChart3 },
  { href: "/analytics/advanced", label: "Métricas avanzadas", icon: TrendingUp },
  { href: "/analytics/growth", label: "Crecimiento", icon: TrendingUp },
  { href: "/agenda",    label: "Agenda",     icon: Calendar },
  { href: "/services",  label: "Servicios",  icon: Wrench },
  { href: "/clients",   label: "Clientes",   icon: Users },
  // Iter56 P2 Fase 2.2 — Reviews moderation queue.
  { href: "/reviews",   label: "Reseñas",    icon: Star },
  { href: "/payments",  label: "Pagos",      icon: CreditCard },
  { href: "/invoices",  label: "Facturas",   icon: Receipt },
  { href: "/analytics/chatbot", label: "Chatbot IA", icon: Sparkles },
  { href: "/chat",       label: "Chat de pago", icon: MessageCircle },
  { href: "/forum",      label: "Foro",       icon: Users2 },
  { href: "/referrals",  label: "Referidos",  icon: Gift },
  { href: "/badges",     label: "Logros",     icon: Trophy },
  { href: "/newsletter", label: "Newsletter", icon: Mail },
  { href: "/notifications", label: "Notificaciones", icon: Bell },
  { href: "/exports",    label: "Exportar datos", icon: Download },
  { href: "/help",       label: "Ayuda",      icon: HelpCircle },
  { href: "/settings",  label: "Ajustes",    icon: Settings },
  { href: "/settings/security",  label: "Seguridad",    icon: ShieldCheck },
];

export default function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav: NavItem[] = (() => {
    const items = [...NAV];
    if (
      user.is_sensitive_vertical ||
      user.business_category === "entertainment_private" ||
      user.is_admin
    ) {
      items.push({ href: "/verificacion", label: "Verificación", icon: ShieldCheck });
    }
    // Iter91 — RBAC: admin sees the full back-office; moderator sees a
    // scoped subset (audit, users list, forum moderation, pilot view).
    const isAdmin = Boolean(user.is_admin) || user.role === "admin";
    const isModerator = user.role === "moderator";
    if (isAdmin) {
      items.push({ href: "/admin", label: "Panel Admin", icon: ShieldCheck });
      items.push({ href: "/admin/users", label: "Usuarias", icon: Users });
      items.push({ href: "/admin/roles", label: "Roles", icon: UserCog });
      items.push({ href: "/admin/invite-codes", label: "Códigos (admin)", icon: ShieldCheck });
      items.push({ href: "/admin/security", label: "Auditoría", icon: ShieldCheck });
      items.push({ href: "/admin/reports", label: "Reportes", icon: ShieldCheck });
      items.push({ href: "/admin/report-categories", label: "Categorías reportes", icon: Flag });
      items.push({ href: "/admin/moderation-templates", label: "Plantillas moderación", icon: Sparkles });
      items.push({ href: "/admin/ai-usage", label: "Consumo IA", icon: Cpu });
      items.push({ href: "/admin/health", label: "Estado sistema", icon: Activity });
      items.push({ href: "/admin/pilot", label: "Programa Piloto", icon: ShieldCheck });
    } else if (isModerator) {
      // Moderator: read-only + moderation only (no invite-codes, no roles).
      items.push({ href: "/admin/moderator", label: "Panel Moderador", icon: ShieldCheck });
      items.push({ href: "/admin/users", label: "Usuarias", icon: Users });
      items.push({ href: "/admin/security", label: "Auditoría", icon: ShieldCheck });
      items.push({ href: "/admin/reports", label: "Reportes", icon: ShieldCheck });
      items.push({ href: "/admin/report-categories", label: "Categorías reportes", icon: Flag });
      items.push({ href: "/admin/moderation-templates", label: "Plantillas moderación", icon: Sparkles });
      items.push({ href: "/admin/ai-usage", label: "Consumo IA", icon: Cpu });
      items.push({ href: "/admin/health", label: "Estado sistema", icon: Activity });
      items.push({ href: "/admin/pilot", label: "Programa Piloto (ver)", icon: ShieldCheck });
    }
    return items;
  })();

  const initials = (user.full_name || user.email || "?")
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 h-screen">
        <BrandBlock />
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((n) => (
            <SidebarLink key={n.href} item={n} active={pathname.startsWith(n.href)} onNavigate={() => setMobileOpen(false)} />
          ))}
        </nav>
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
          <PlanCard plan={user.plan || "basic"} />
        </div>
      </aside>

      {/* Sidebar mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <aside
            className="absolute top-0 left-0 h-full w-72 bg-white dark:bg-neutral-900 shadow-xl flex flex-col animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
              <BrandBlock />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {nav.map((n) => (
                <SidebarLink key={n.href} item={n} active={pathname.startsWith(n.href)} onNavigate={() => setMobileOpen(false)} />
              ))}
            </nav>
            <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
              <PlanCard plan={user.plan || "basic"} />
            </div>
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-900/80 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 px-4 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
            </button>
            <h1 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {nav.find((n) => pathname.startsWith(n.href))?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <GlobalSearch />
            {(user.is_admin || user.role === "admin" || user.role === "moderator") && (
              <StaffNotificationsBell />
            )}
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 pl-1 pr-2 py-1 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-violet-600 text-white text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left leading-tight">
                  <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
                    {user.full_name || user.email}
                    {(user.is_admin || user.role === "admin") && (
                      <Badge variant="outline" className="text-[9px] py-0 h-4 px-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300">
                        ADMIN
                      </Badge>
                    )}
                    {user.role === "moderator" && !user.is_admin && (
                      <Badge variant="outline" className="text-[9px] py-0 h-4 px-1 border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-300">
                        MOD
                      </Badge>
                    )}
                  </p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{user.business_name || "—"}</p>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings"><Settings className="h-4 w-4 mr-2" /> Ajustes</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-700">
                  <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function BrandBlock() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 p-4 border-b border-neutral-100 dark:border-neutral-800">
      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-600 to-violet-700 text-white flex items-center justify-center shadow-sm">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">AI Booking</p>
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Dashboard</p>
      </div>
    </Link>
  );
}

function SidebarLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
        active
          ? "bg-violet-50 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200 font-semibold ring-1 ring-violet-100 dark:ring-violet-900/50"
          : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? "text-violet-700 dark:text-violet-300" : "text-neutral-400 dark:text-neutral-500"}`} />
      {item.label}
    </Link>
  );
}

function PlanCard({ plan }: { plan: string }) {
  const color: Record<string, string> = {
    basic:   "from-neutral-400 to-neutral-500",
    pro:     "from-violet-500 to-violet-700",
    premium: "from-amber-500 to-amber-600",
  };
  return (
    <div className={`rounded-lg bg-gradient-to-br ${color[plan] || color.basic} text-white p-3 shadow-sm`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Plan</p>
      <div className="flex items-center justify-between mt-0.5">
        <p className="text-lg font-bold">{plan.charAt(0).toUpperCase() + plan.slice(1)}</p>
        <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px]">AI Pay</Badge>
      </div>
    </div>
  );
}
