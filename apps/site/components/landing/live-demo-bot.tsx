"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Bot, User, Zap } from "lucide-react";

type Msg = { role: "bot" | "client"; text: string; ts: number };

type Lang = "es" | "ca" | "en";

const SEED_BY_LANG: Record<Lang, Msg[]> = {
  es: [{ role: "bot", ts: 0, text: "¡Hola! Soy la asistente virtual de Estudio Isabel. ¿Quieres reservar un corte, tinte o servicio combo?" }],
  ca: [{ role: "bot", ts: 0, text: "Hola! Sóc l'assistent virtual de l'Estudi Isabel. Vols reservar un tall, un tint o un servei combo?" }],
  en: [{ role: "bot", ts: 0, text: "Hi! I'm Isabel's virtual assistant. Would you like to book a haircut, color, or combo service?" }],
};

const HINTS_BY_LANG: Record<Lang, string[]> = {
  es: ["quiero un corte", "esta semana", "el jueves a las 4", "cuánto cuesta?"],
  ca: ["vull un tall", "aquesta setmana", "dijous a les 4", "quant costa?"],
  en: ["I want a haircut", "this week", "thursday 4pm", "how much?"],
};

const LABELS: Record<Lang, { title: string; status: string; badge: string; placeholder: string; error: string }> = {
  es: {
    title: "Estudio Isabel · Demo en vivo",
    status: "en línea · responde en <1 seg",
    badge: "Demo",
    placeholder: "Escribe algo… ('quiero un corte', 'esta semana')",
    error: "Uy, ha habido un pequeño error. Prueba de nuevo 💚",
  },
  ca: {
    title: "Estudi Isabel · Demo en directe",
    status: "en línia · respon en <1 seg",
    badge: "Demo",
    placeholder: "Escriu alguna cosa… ('vull un tall', 'aquesta setmana')",
    error: "Ep, ha passat alguna cosa. Prova un altre cop 💚",
  },
  en: {
    title: "Estudio Isabel · Live demo",
    status: "online · replies in <1 sec",
    badge: "Demo",
    placeholder: "Type something… ('I want a haircut', 'this week')",
    error: "Oops, something went wrong. Try again 💚",
  },
};

export default function LiveDemoBot() {
  const [lang, setLang] = useState<Lang>("es");
  const [msgs, setMsgs] = useState<Msg[]>(SEED_BY_LANG.es);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [sessionId] = useState(
    () => `demo_${Math.random().toString(36).slice(2, 10)}${Date.now()}`
  );
  const listRef = useRef<HTMLDivElement | null>(null);

  // Reset conversation when the language changes
  useEffect(() => {
    setMsgs(SEED_BY_LANG[lang]);
    setInput("");
  }, [lang]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [msgs, thinking]);

  async function send(text?: string) {
    const payload = (text ?? input).trim();
    if (!payload || thinking) return;
    setInput("");
    setMsgs((m) => [...m, { role: "client", text: payload, ts: Date.now() }]);
    setThinking(true);
    try {
      const r = await fetch("/api/backend/public/demo-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: payload, session_id: sessionId, lang }),
      });
      const data = await r.json();
      await new Promise((res) => setTimeout(res, data.typing_ms || 800));
      setMsgs((m) => [...m, { role: "bot", text: data.reply, ts: Date.now() }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: LABELS[lang].error, ts: Date.now() }]);
    } finally {
      setThinking(false);
    }
  }

  const L = LABELS[lang];
  const HINTS = HINTS_BY_LANG[lang];

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
        {/* Iter68 — language switcher */}
        <div className="inline-flex bg-neutral-100 dark:bg-neutral-800 rounded-full p-0.5">
          {(["es", "ca", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition-colors ${
                l === lang
                  ? "bg-violet-600 text-white"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              }`}
              aria-label={`Idioma ${l.toUpperCase()}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
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
