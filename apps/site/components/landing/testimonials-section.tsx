// Testimonials section for the marketing landing.
// Pre-launch phase: shows placeholder testimonials with a "Founding member" badge.
// Once real beta users provide feedback, swap the array below or wire it up to a CMS.
import { useTranslations } from "next-intl";
import { Star, Quote } from "lucide-react";

type Testimonial = {
  key: string;
  emoji: string;
  stars: number;
};

const TESTIMONIALS: Testimonial[] = [
  { key: "t1", emoji: "💅", stars: 5 },
  { key: "t2", emoji: "🎓", stars: 5 },
  { key: "t3", emoji: "🏋️", stars: 5 },
  { key: "t4", emoji: "🧠", stars: 5 },
];

export default function TestimonialsSection() {
  const t = useTranslations("home.testimonials");

  return (
    <section className="py-16 md:py-24 bg-neutral-50 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-3 py-1 text-xs font-medium mb-4">
            <Star className="h-3.5 w-3.5 fill-current" />
            {t("badge")}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-4">
            {t("title")}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {TESTIMONIALS.map((item) => (
            <article
              key={item.key}
              className="relative flex flex-col p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Quote className="absolute top-4 right-4 h-6 w-6 text-neutral-200 dark:text-neutral-800" />
              <div className="flex items-center gap-2 mb-3">
                {Array.from({ length: item.stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed mb-6 flex-1">
                &ldquo;{t(`${item.key}.quote`)}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-lg">
                  {item.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                    {t(`${item.key}.name`)}
                  </div>
                  <div className="text-xs text-neutral-500 truncate">
                    {t(`${item.key}.role`)}
                  </div>
                </div>
              </div>
              <div className="absolute -top-2 -left-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                {t("foundingMember")}
              </div>
            </article>
          ))}
        </div>

        <p className="text-center text-xs text-neutral-500 dark:text-neutral-500 mt-8 italic">
          {t("betaNote")}
        </p>
      </div>
    </section>
  );
}
