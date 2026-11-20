import "server-only";

/**
 * Sensible platform: messages with sexually explicit content are never sent to the AI model
 * (provider usage policy). They go straight to the professional. Deliberately broad: a false
 * positive only means the professional answers that message herself.
 */
const TERMS = [
  // en
  "sex", "sexual", "nude", "naked", "blowjob", "bj", "anal", "oral", "fuck", "cum", "orgasm", "penis", "dick", "cock", "pussy", "vagina", "boobs", "tits", "condom", "bareback", "gfe", "pse", "69", "fetish", "bdsm", "erotic", "horny", "threesome", "handjob", "deepthroat", "porn", "escort service",
  // es
  "sexo", "sexual", "desnuda", "desnudo", "follar", "mamada", "oral", "anal", "polla", "pene", "coño", "vagina", "tetas", "corrida", "correrse", "condon", "condón", "sin condon", "griego", "francés natural", "frances natural", "fetiche", "erotico", "erótico", "cachondo", "cachonda", "trio", "trío", "paja", "garganta profunda", "porno",
  // fr
  "baiser", "pipe", "sodomie", "bite", "chatte", "seins", "capote", "préservatif", "preservatif", "érotique", "excité", "branlette", "partouze",
  // de
  "ficken", "blasen", "schwanz", "muschi", "titten", "kondom", "erotisch", "geil", "dreier", "nackt",
  // it
  "scopare", "pompino", "cazzo", "figa", "tette", "preservativo", "erotico", "nuda", "nudo",
  // pt
  "foder", "boquete", "pau", "buceta", "peitos", "camisinha", "preservativo", "erótico", "pelada", "pelado", "gozar",
  // ru (latin/cyrillic)
  "секс", "минет", "анал", "голая", "голый", "презерватив", "эротика", "интим",
  // nl / ro / pl
  "neuken", "pijpen", "lul", "kut", "condoom", "futut", "muie", "pula", "pizda", "prezervativ", "pieprzyć", "laska", "kutas", "cipka", "prezerwatywa",
];
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const PATTERNS = [...new Set(TERMS.map(norm))].map((t) => new RegExp(`(^|[^\\p{L}\\p{N}])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}\\p{N}])`, "u"));

export function isExplicit(text: string) {
  const n = norm(text);
  return PATTERNS.some((p) => p.test(n));
}

export const HIDDEN_PLACEHOLDER = "[Private message for the professional — not shown to the assistant]";
