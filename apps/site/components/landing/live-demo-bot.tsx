"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Send, Bot, User, Zap } from "lucide-react";

type Msg = { role: "bot" | "client"; text: string; ts: number };

type Lang = "es" | "en" | "fr" | "de" | "it" | "pt-BR" | "ru" | "nl" | "ro" | "pl";

type Copy = {
  seed: string;
  hints: string[];
  title: string;
  status: string;
  badge: string;
  placeholder: string;
  slots: string;
  confirm: (slot: string) => string;
  price: string;
  fallback: string;
};

/**
 * Demo guionizada (sin backend): muestra el flujo real de AIBA
 * — servicio → huecos → reserva + señal — en el idioma de la web.
 */
const COPY: Record<Lang, Copy> = {
  es: {
    seed: "¡Hola! Soy la asistente virtual de Estudio Isabel. ¿Quieres reservar un corte, tinte o servicio combo?",
    hints: ["quiero un corte", "esta semana", "el jueves a las 4", "¿cuánto cuesta?"],
    title: "Estudio Isabel · Demo en vivo",
    status: "en línea · responde en <1 seg",
    badge: "Demo",
    placeholder: "Escribe algo… («quiero un corte», «esta semana»)",
    slots: "¡Genial! Esta semana tengo libre el jueves a las 16:00, el viernes a las 10:30 o el sábado a las 12:00. ¿Cuál te va mejor?",
    confirm: (s) => `Perfecto, te reservo ${s} ✓ Para confirmar la cita, paga la señal de 10 € aquí: aiba.app/pagar · 1 h antes te enviaré un código de 6 dígitos.`,
    price: "Corte 25 € (45 min) · Tinte 40 € (1 h 30) · Combo corte + tinte 60 € (2 h). ¿Te busco un hueco?",
    fallback: "Puedo ayudarte con cortes, tintes y combos, decirte precios o buscarte hueco. ¿Qué te apetece?",
  },
  en: {
    seed: "Hi! I'm the virtual assistant at Estudio Isabel. Would you like to book a haircut, colour or combo?",
    hints: ["I want a haircut", "this week", "Thursday at 4pm", "how much?"],
    title: "Estudio Isabel · Live demo",
    status: "online · replies in <1 sec",
    badge: "Demo",
    placeholder: "Type something… ('I want a haircut', 'this week')",
    slots: "Great! This week I have Thursday at 4:00 pm, Friday at 10:30 am or Saturday at 12:00. Which suits you best?",
    confirm: (s) => `Perfect, you're booked for ${s} ✓ To confirm, pay the €10 deposit here: aiba.app/pay · I'll send you a 6-digit code 1 h before.`,
    price: "Haircut €25 (45 min) · Colour €40 (1 h 30) · Haircut + colour combo €60 (2 h). Shall I find you a slot?",
    fallback: "I can help with haircuts, colour and combos, tell you prices or find you a slot. What would you like?",
  },
  fr: {
    seed: "Bonjour ! Je suis l'assistante virtuelle d'Estudio Isabel. Vous souhaitez réserver une coupe, une couleur ou une formule combo ?",
    hints: ["je veux une coupe", "cette semaine", "jeudi à 16h", "combien ça coûte ?"],
    title: "Estudio Isabel · Démo en direct",
    status: "en ligne · répond en <1 s",
    badge: "Démo",
    placeholder: "Écrivez quelque chose… (« je veux une coupe », « cette semaine »)",
    slots: "Super ! Cette semaine j'ai jeudi à 16h00, vendredi à 10h30 ou samedi à 12h00. Qu'est-ce qui vous convient le mieux ?",
    confirm: (s) => `Parfait, c'est réservé pour ${s} ✓ Pour confirmer, payez l'acompte de 10 € ici : aiba.app/payer · Je vous enverrai un code à 6 chiffres 1 h avant.`,
    price: "Coupe 25 € (45 min) · Couleur 40 € (1 h 30) · Combo coupe + couleur 60 € (2 h). Je vous cherche un créneau ?",
    fallback: "Je peux vous aider pour les coupes, couleurs et combos, vous donner les prix ou trouver un créneau. Que souhaitez-vous ?",
  },
  de: {
    seed: "Hallo! Ich bin die virtuelle Assistentin von Estudio Isabel. Möchtest du einen Haarschnitt, eine Färbung oder ein Kombi-Paket buchen?",
    hints: ["ich möchte einen Haarschnitt", "diese Woche", "Donnerstag um 16 Uhr", "was kostet das?"],
    title: "Estudio Isabel · Live-Demo",
    status: "online · antwortet in <1 Sek.",
    badge: "Demo",
    placeholder: "Schreib etwas… („Haarschnitt“, „diese Woche“)",
    slots: "Super! Diese Woche habe ich Donnerstag um 16:00, Freitag um 10:30 oder Samstag um 12:00 frei. Was passt dir am besten?",
    confirm: (s) => `Perfekt, ich habe dich für ${s} eingetragen ✓ Zur Bestätigung zahle die Anzahlung von 10 € hier: aiba.app/zahlen · 1 Std. vorher schicke ich dir einen 6-stelligen Code.`,
    price: "Haarschnitt 25 € (45 Min.) · Färbung 40 € (1 Std. 30) · Kombi Schnitt + Färbung 60 € (2 Std.). Soll ich dir einen Termin suchen?",
    fallback: "Ich helfe dir bei Haarschnitt, Färbung und Kombis, nenne dir Preise oder suche dir einen Termin. Was möchtest du?",
  },
  it: {
    seed: "Ciao! Sono l'assistente virtuale di Estudio Isabel. Vuoi prenotare un taglio, un colore o un servizio combo?",
    hints: ["vorrei un taglio", "questa settimana", "giovedì alle 16", "quanto costa?"],
    title: "Estudio Isabel · Demo dal vivo",
    status: "online · risponde in <1 sec",
    badge: "Demo",
    placeholder: "Scrivi qualcosa… («vorrei un taglio», «questa settimana»)",
    slots: "Perfetto! Questa settimana ho giovedì alle 16:00, venerdì alle 10:30 o sabato alle 12:00. Quale preferisci?",
    confirm: (s) => `Fatto, ti ho prenotato ${s} ✓ Per confermare paga l'acconto di 10 € qui: aiba.app/paga · 1 h prima ti mando un codice di 6 cifre.`,
    price: "Taglio 25 € (45 min) · Colore 40 € (1 h 30) · Combo taglio + colore 60 € (2 h). Ti cerco un orario?",
    fallback: "Posso aiutarti con tagli, colore e combo, dirti i prezzi o trovarti un orario. Cosa ti serve?",
  },
  "pt-BR": {
    seed: "Oi! Sou a assistente virtual do Estudio Isabel. Quer reservar um corte, coloração ou um combo?",
    hints: ["quero um corte", "esta semana", "quinta às 16h", "quanto custa?"],
    title: "Estudio Isabel · Demo ao vivo",
    status: "online · responde em <1 seg",
    badge: "Demo",
    placeholder: "Escreva algo… (\"quero um corte\", \"esta semana\")",
    slots: "Ótimo! Esta semana tenho quinta às 16:00, sexta às 10:30 ou sábado às 12:00. Qual fica melhor para você?",
    confirm: (s) => `Perfeito, reservei ${s} para você ✓ Para confirmar, pague o sinal de €10 aqui: aiba.app/pagar · 1 h antes envio um código de 6 dígitos.`,
    price: "Corte €25 (45 min) · Coloração €40 (1 h 30) · Combo corte + coloração €60 (2 h). Quer que eu procure um horário?",
    fallback: "Posso ajudar com cortes, coloração e combos, informar preços ou encontrar um horário. O que você prefere?",
  },
  ru: {
    seed: "Здравствуйте! Я виртуальный ассистент Estudio Isabel. Хотите записаться на стрижку, окрашивание или комплекс?",
    hints: ["хочу стрижку", "на этой неделе", "в четверг в 16:00", "сколько стоит?"],
    title: "Estudio Isabel · Живая демо",
    status: "онлайн · отвечает за <1 сек",
    badge: "Демо",
    placeholder: "Напишите что-нибудь… («хочу стрижку», «на этой неделе»)",
    slots: "Отлично! На этой неделе свободно: четверг 16:00, пятница 10:30 или суббота 12:00. Что вам удобнее?",
    confirm: (s) => `Готово, записала вас на ${s} ✓ Для подтверждения внесите предоплату 10 € здесь: aiba.app/pay · За 1 ч до визита пришлю 6-значный код.`,
    price: "Стрижка 25 € (45 мин) · Окрашивание 40 € (1 ч 30) · Стрижка + окрашивание 60 € (2 ч). Подобрать вам время?",
    fallback: "Я помогу со стрижкой, окрашиванием и комплексами, подскажу цены или подберу время. Что вас интересует?",
  },
  nl: {
    seed: "Hoi! Ik ben de virtuele assistent van Estudio Isabel. Wil je een knipbeurt, kleuring of combo boeken?",
    hints: ["ik wil knippen", "deze week", "donderdag om 16 uur", "wat kost het?"],
    title: "Estudio Isabel · Live demo",
    status: "online · antwoordt in <1 sec",
    badge: "Demo",
    placeholder: "Typ iets… („ik wil knippen”, „deze week”)",
    slots: "Top! Deze week heb ik donderdag om 16:00, vrijdag om 10:30 of zaterdag om 12:00. Wat past jou het best?",
    confirm: (s) => `Perfect, je staat genoteerd voor ${s} ✓ Betaal ter bevestiging de aanbetaling van €10 hier: aiba.app/pay · 1 uur vooraf stuur ik je een 6-cijferige code.`,
    price: "Knippen €25 (45 min) · Kleuren €40 (1 u 30) · Combo knippen + kleuren €60 (2 u). Zal ik een tijd voor je zoeken?",
    fallback: "Ik help je met knippen, kleuren en combo's, noem prijzen of zoek een tijd. Wat wil je?",
  },
  ro: {
    seed: "Bună! Sunt asistenta virtuală a Estudio Isabel. Vrei să rezervi o tunsoare, vopsit sau un pachet combo?",
    hints: ["vreau o tunsoare", "săptămâna asta", "joi la 16", "cât costă?"],
    title: "Estudio Isabel · Demo live",
    status: "online · răspunde în <1 sec",
    badge: "Demo",
    placeholder: "Scrie ceva… („vreau o tunsoare”, „săptămâna asta”)",
    slots: "Super! Săptămâna asta am joi la 16:00, vineri la 10:30 sau sâmbătă la 12:00. Ce ți se potrivește?",
    confirm: (s) => `Perfect, te-am programat ${s} ✓ Pentru confirmare, plătește avansul de 10 € aici: aiba.app/pay · Cu 1 h înainte îți trimit un cod din 6 cifre.`,
    price: "Tunsoare 25 € (45 min) · Vopsit 40 € (1 h 30) · Combo tunsoare + vopsit 60 € (2 h). Îți caut o oră?",
    fallback: "Te pot ajuta cu tunsori, vopsit și pachete, îți spun prețurile sau îți găsesc o oră. Ce dorești?",
  },
  pl: {
    seed: "Cześć! Jestem wirtualną asystentką Estudio Isabel. Chcesz zarezerwować strzyżenie, koloryzację czy pakiet?",
    hints: ["chcę strzyżenie", "w tym tygodniu", "czwartek o 16", "ile to kosztuje?"],
    title: "Estudio Isabel · Demo na żywo",
    status: "online · odpowiada w <1 s",
    badge: "Demo",
    placeholder: "Napisz coś… („chcę strzyżenie”, „w tym tygodniu”)",
    slots: "Super! W tym tygodniu mam czwartek 16:00, piątek 10:30 lub sobotę 12:00. Co ci pasuje?",
    confirm: (s) => `Gotowe, zapisałam cię na ${s} ✓ Aby potwierdzić, zapłać 10 € zaliczki tutaj: aiba.app/pay · Godzinę wcześniej wyślę ci 6-cyfrowy kod.`,
    price: "Strzyżenie 25 € (45 min) · Koloryzacja 40 € (1 h 30) · Pakiet strzyżenie + koloryzacja 60 € (2 h). Poszukać ci terminu?",
    fallback: "Pomogę ze strzyżeniem, koloryzacją i pakietami, podam ceny lub znajdę termin. Czego potrzebujesz?",
  },
};

const SLOT_LABELS: Record<Lang, [RegExp, string][]> = {
  es: [[/jue|4|16/i, "el jueves a las 16:00"], [/vie|10/i, "el viernes a las 10:30"], [/s[áa]b|12/i, "el sábado a las 12:00"]],
  en: [[/thu|4|16/i, "Thursday at 4:00 pm"], [/fri|10/i, "Friday at 10:30 am"], [/sat|12/i, "Saturday at 12:00"]],
  fr: [[/jeu|16|4/i, "jeudi à 16h00"], [/ven|10/i, "vendredi à 10h30"], [/sam|12/i, "samedi à 12h00"]],
  de: [[/don|16|4/i, "Donnerstag um 16:00"], [/fre|10/i, "Freitag um 10:30"], [/sam|12/i, "Samstag um 12:00"]],
  it: [[/gio|16|4/i, "giovedì alle 16:00"], [/ven|10/i, "venerdì alle 10:30"], [/sab|12/i, "sabato alle 12:00"]],
  "pt-BR": [[/qui|16|4/i, "quinta às 16:00"], [/sex|10/i, "sexta às 10:30"], [/s[áa]b|12/i, "sábado às 12:00"]],
  ru: [[/чет|16|4/i, "четверг 16:00"], [/пят|10/i, "пятницу 10:30"], [/суб|12/i, "субботу 12:00"]],
  nl: [[/don|16|4/i, "donderdag om 16:00"], [/vrij|10/i, "vrijdag om 10:30"], [/zat|12/i, "zaterdag om 12:00"]],
  ro: [[/joi|16|4/i, "joi la 16:00"], [/vin|10/i, "vineri la 10:30"], [/s[âa]m|12/i, "sâmbătă la 12:00"]],
  pl: [[/czw|16|4/i, "czwartek 16:00"], [/pi[ąa]t|10/i, "piątek 10:30"], [/sob|12/i, "sobotę 12:00"]],
};

const PRICE_RE = /cu[áa]nto|precio|cuesta|how much|price|cost|combien|prix|co[ûu]te|kostet|preis|quanto|costa|prezz|pre[çc]o|custa|сколько|цен|стоит|kost|prijs|cât|pre[țt]|\bile\b|cena|kosztuje/i;

function reply(lang: Lang, text: string, offered: boolean): { text: string; offered: boolean } {
  const c = COPY[lang];
  if (PRICE_RE.test(text)) return { text: c.price, offered };
  if (offered || /\d/.test(text)) {
    const hit = SLOT_LABELS[lang].find(([re]) => re.test(text));
    if (hit) return { text: c.confirm(hit[1]), offered: false };
  }
  if (text.trim().length >= 2) return { text: c.slots, offered: true };
  return { text: c.fallback, offered };
}

export default function LiveDemoBot() {
  const locale = useLocale();
  const lang: Lang = (Object.keys(COPY) as Lang[]).includes(locale as Lang) ? (locale as Lang) : "en";
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", ts: 0, text: COPY[lang].seed }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [offered, setOffered] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMsgs([{ role: "bot", ts: 0, text: COPY[lang].seed }]);
    setOffered(false);
    setInput("");
  }, [lang]);

  useEffect(() => {
    const el = listRef.current;
    if (el && msgs.length > 1) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  async function send(text?: string) {
    const payload = (text ?? input).trim();
    if (!payload || thinking) return;
    setInput("");
    setMsgs((m) => [...m, { role: "client", text: payload, ts: Date.now() }]);
    setThinking(true);
    const r = reply(lang, payload, offered);
    await new Promise((res) => setTimeout(res, 700 + Math.min(900, r.text.length * 6)));
    setOffered(r.offered);
    setMsgs((m) => [...m, { role: "bot", text: r.text, ts: Date.now() }]);
    setThinking(false);
  }

  const L = COPY[lang];
  const HINTS = L.hints;

  return (
    <div className="rounded-2xl border border-violet-200 dark:border-violet-900/40 bg-gradient-to-br from-white via-violet-50/30 to-white dark:from-neutral-900 dark:via-violet-950/20 dark:to-neutral-900 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-violet-200/50 dark:border-violet-900/40 flex items-center gap-3 bg-white/60 dark:bg-neutral-950/60 backdrop-blur">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{L.title}</p>
          <p className="text-[11px] text-violet-600 dark:text-violet-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
            {L.status}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/20 px-2 py-1 rounded-full">
          <Zap className="h-3 w-3" /> {L.badge}
        </span>
      </div>

      {/* Messages */}
      <div ref={listRef} className="px-4 py-4 space-y-3 h-72 overflow-y-auto bg-neutral-50/30 dark:bg-neutral-950/30">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "client" ? "justify-end" : "justify-start"}`}>
            <div className={`flex items-end gap-2 max-w-[85%] ${m.role === "client" ? "flex-row-reverse" : ""}`}>
              <div className={`h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center text-white ${
                m.role === "bot"
                  ? "bg-gradient-to-br from-violet-500 to-fuchsia-500"
                  : "bg-neutral-400 dark:bg-neutral-600"
              }`}>
                {m.role === "bot" ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
              </div>
              <div className={`px-3 py-2 rounded-2xl text-sm ${
                m.role === "bot"
                  ? "bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-bl-sm"
                  : "bg-violet-600 text-white rounded-br-sm"
              }`}>
                {m.text}
              </div>
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
                <Bot className="h-3 w-3" />
              </div>
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl rounded-bl-sm px-3 py-2">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick hints */}
      {msgs.length <= 2 && (
        <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-neutral-200 dark:border-neutral-800 bg-white/40 dark:bg-neutral-950/40">
          {HINTS.map((h) => (
            <button
              key={h}
              onClick={() => send(h)}
              disabled={thinking}
              className="text-[11px] px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-500/20 transition-colors disabled:opacity-50"
            >
              {h}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex gap-2 bg-white dark:bg-neutral-900"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={L.placeholder}
          disabled={thinking}
          className="flex-1 px-3 py-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
        <button
          type="submit"
          disabled={!input.trim() || thinking}
          className="h-9 w-9 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
