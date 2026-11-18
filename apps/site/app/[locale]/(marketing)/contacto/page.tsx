"use client";

import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Sparkles, Mail, MessageCircle, Send, CheckCircle2 } from "lucide-react";

const SUBJECT_KEYS = ["demo", "pricing", "support", "press", "other"] as const;

export default function ContactPage() {
  const t = useTranslations("contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<(typeof SUBJECT_KEYS)[number]>("demo");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const subjectLabel = t(`formSubjects.${subject}`);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    const body = [`${t("labelName")}: ${name}`, `${t("labelEmail")}: ${email}`, `${t("labelSubject")}: ${subjectLabel}`, "", `${t("labelMessage")}:`, message].join("\n");
    const mailto = `mailto:info@aibookingassistant.app?subject=${encodeURIComponent(`[Web] ${subjectLabel} — ${name}`)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setSent(true);
  }

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 px-3 py-1 text-xs font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />{t("badge")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-4">{t("title")}</h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">{t("subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <aside className="md:col-span-1 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
              <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 flex items-center justify-center mb-3"><Mail className="h-5 w-5" /></div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{t("sidebarEmailTitle")}</p>
              <a href="mailto:info@aibookingassistant.app" className="text-sm text-violet-700 dark:text-violet-300 hover:underline break-all">info@aibookingassistant.app</a>
              <p className="text-xs text-neutral-500 mt-2">{t("sidebarEmailDesc")}</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800">
              <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 flex items-center justify-center mb-3"><MessageCircle className="h-5 w-5" /></div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{t("sidebarBotTitle")}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{t("sidebarBotDesc")}</p>
              <a href="https://t.me/My_AI_Booking_Assistant_Bot" target="_blank" rel="noopener noreferrer" className="text-sm text-violet-700 dark:text-violet-300 hover:underline font-medium">@My_AI_Booking_Assistant_Bot →</a>
            </div>
            <div className="p-5 rounded-2xl bg-violet-50 dark:bg-violet-950/30 ring-1 ring-violet-200 dark:ring-violet-900/50">
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{t("sidebarTip")}</p>
            </div>
          </aside>

          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:ring-neutral-800 space-y-5">
              {sent && (
                <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-950/30 ring-1 ring-violet-200 dark:ring-violet-900/50 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">{t("successTitle")}</p>
                    <p className="text-xs text-violet-800 dark:text-violet-200 mt-1">
                      {t("successBody")}<a href="mailto:info@aibookingassistant.app" className="underline font-medium">info@aibookingassistant.app</a>.
                    </p>
                  </div>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">{t("labelName")} *</label>
                  <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 ring-1 ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-violet-500 outline-none text-sm text-neutral-900 dark:text-neutral-100" placeholder={t("placeholderName")} />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">{t("labelEmail")} *</label>
                  <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 ring-1 ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-violet-500 outline-none text-sm text-neutral-900 dark:text-neutral-100" placeholder={t("placeholderEmail")} />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">{t("labelSubject")}</label>
                <select id="subject" value={subject} onChange={(e) => setSubject(e.target.value as (typeof SUBJECT_KEYS)[number])} className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 ring-1 ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-violet-500 outline-none text-sm text-neutral-900 dark:text-neutral-100">
                  {SUBJECT_KEYS.map((s) => <option key={s} value={s}>{t(`formSubjects.${s}`)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5">{t("labelMessage")} *</label>
                <textarea id="message" required rows={6} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 ring-1 ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-violet-500 outline-none text-sm text-neutral-900 dark:text-neutral-100 resize-none" placeholder={t("placeholderMessage")} />
              </div>
              <button type="submit" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-600/20">
                <Send className="h-4 w-4" />{t("sendBtn")}
              </button>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t("legalNoteStart")}<Link href="/legal/privacidad" className="text-violet-700 dark:text-violet-300 hover:underline">{t("legalNoteLink")}</Link>{t("legalNoteEnd")}
              </p>
            </form>
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">{t("finalCtaTitle")}</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">{t("finalCtaSubtitle")}</p>
          <Link href="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-violet-600 hover:bg-violet-700 text-white text-base font-semibold transition-colors shadow-sm">
            {t("finalCtaBtn")}<ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
