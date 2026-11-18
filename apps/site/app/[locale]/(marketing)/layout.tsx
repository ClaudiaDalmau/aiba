import { AibaLogo } from "@/components/aiba-logo";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { hasSession } from "@/lib/session";
import LanguageSwitcher from "@/components/language-switcher";
import { ManageCookiesLink } from "@/components/cookie-consent/manage-cookies-link";
import {
  organizationJsonLd,
  websiteJsonLd,
  softwareApplicationJsonLd,
  toJsonLdScript,
} from "@/lib/seo";

/**
 * Public marketing layout: header + footer visible on every /,/precios,/faq,...
 * Fully internationalized via next-intl. Sits alongside (auth) and (app).
 *
 * SEO: injects JSON-LD structured data (Organization + WebSite +
 * SoftwareApplication) so Google can render rich results (star ratings,
 * sitelinks searchbox, knowledge panel).
 */
export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [isLoggedIn, tHeader, tFooter] = await Promise.all([
    hasSession(),
    getTranslations("header"),
    getTranslations("footer"),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* JSON-LD structured data (rich results) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(organizationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(websiteJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(softwareApplicationJsonLd()) }}
      />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#050507]/75 backdrop-blur-xl backdrop-saturate-150 border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="AIBA">
            <AibaLogo size={28} tone="light" />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-[13px]">
            <Link href="/como-funciona" className="text-neutral-300 hover:text-white transition-colors">{tHeader("nav.howItWorks")}</Link>
            <Link href="/tipos-de-negocio" className="text-neutral-300 hover:text-white transition-colors">{tHeader("nav.businessTypes")}</Link>
            <Link href="/precios" className="text-neutral-300 hover:text-white transition-colors">{tHeader("nav.pricing")}</Link>
            <Link href="/faq" className="text-neutral-300 hover:text-white transition-colors">{tHeader("nav.faq")}</Link>
            <Link href="/blog" className="text-neutral-300 hover:text-white transition-colors">Blog</Link>
            <Link href="/contacto" className="text-neutral-300 hover:text-white transition-colors">{tHeader("nav.contact")}</Link>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher variant="dark" />
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-[#050507] text-[13px] font-semibold transition-colors"
              >
                {tHeader("cta.goToDashboard")}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline text-[13px] text-neutral-300 hover:text-white px-3 py-2 transition-colors"
                >
                  {tHeader("cta.login")}
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-[#050507] text-[13px] font-semibold transition-colors"
                >
                  {tHeader("cta.startFree")}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="mt-24 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 grid gap-8 grid-cols-2 md:grid-cols-5">
          <div className="col-span-2">
            <div className="mb-3"><AibaLogo size={28} /></div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm mb-4">
              {tFooter("tagline")}
            </p>
            <a href="mailto:info@aibookingassistant.app" className="text-sm text-violet-700 dark:text-violet-300 hover:underline">
              info@aibookingassistant.app
            </a>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500 mb-3 font-semibold">{tFooter("sections.product")}</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/como-funciona" className="text-neutral-600 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-300">{tFooter("product.howItWorks")}</Link></li>
              <li><Link href="/tipos-de-negocio" className="text-neutral-600 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-300">{tFooter("product.businessTypes")}</Link></li>
              <li><Link href="/precios" className="text-neutral-600 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-300">{tFooter("product.pricing")}</Link></li>
              <li><Link href="/faq" className="text-neutral-600 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-300">{tFooter("product.faq")}</Link></li>
              <li><Link href="/blog" className="text-neutral-600 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-300">Blog</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500 mb-3 font-semibold">{tFooter("sections.company")}</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/nosotros" className="text-neutral-600 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-300">{tFooter("company.about")}</Link></li>
              <li><Link href="/contacto" className="text-neutral-600 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-300">{tFooter("company.contact")}</Link></li>
              <li><a href="/status" className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-300"><span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />Estado del sistema</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500 mb-3 font-semibold">{tFooter("sections.legal")}</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/aviso-legal" className="text-neutral-600 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-300">{tFooter("legal.legalNotice")}</Link></li>
              <li><Link href="/legal/privacidad" className="text-neutral-600 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-300">{tFooter("legal.privacy")}</Link></li>
              <li><Link href="/legal/terminos" className="text-neutral-600 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-300">{tFooter("legal.terms")}</Link></li>
              <li><Link href="/legal/cookies" className="text-neutral-600 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-300">{tFooter("legal.cookies")}</Link></li>
              <li><ManageCookiesLink /></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-200 dark:border-neutral-800">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 text-xs text-neutral-500 dark:text-neutral-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>{tFooter("copyright")}</p>
            <p>{tFooter("madeIn")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
