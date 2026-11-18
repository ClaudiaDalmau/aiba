#!/usr/bin/env python3
"""Update pricing fees across all 7 locale files.

New tier structure (2026-08):
  BASIC:   2.0% per booking (previously — / no fee)
  PRO:     1.5% per booking (previously 1.5%)
  PREMIUM: 1.0% per booking (previously 1.0%)

Handles both the pricing table row `commission` and the FAQ `a3` string
that mentions the numbers explicitly. Idempotent — safe to run multiple times.
"""
import json
import re
from pathlib import Path

MESSAGES_DIR = Path("/app/dashboard-web/messages")

# Per-locale FAQ answer overrides (the sentence structure varies by language)
# Old: "…sobre los depósitos cobrados online (1.5% en Pro, 1.0% en Premium)…"
# New: "…sobre las reservas cobradas online. Basic 2%, Pro 1.5%, Premium 1%."
NEW_FAQ_ANSWERS = {
    "es": "Es una pequeña comisión por reserva cobrada online: **2% en Basic, 1,5% en Pro y 1% en Premium**. Financia el sistema anti-fraude y las mejoras de IA. No pagas nada si el cliente paga en persona.",
    "en": "It's a small per-booking fee on online payments: **2% on Basic, 1.5% on Pro, 1% on Premium**. It funds the anti-fraud system and AI improvements. You pay nothing if the client pays in person.",
    "fr": "C'est une petite commission par réservation payée en ligne : **2 % en Basic, 1,5 % en Pro, 1 % en Premium**. Elle finance le système anti-fraude et les améliorations IA. Vous ne payez rien si le client paie en personne.",
    "de": "Eine kleine Gebühr pro online bezahlter Buchung: **2 % im Basic, 1,5 % im Pro, 1 % im Premium**. Sie finanziert das Anti-Fraud-System und die KI-Verbesserungen. Wenn der Kunde bar zahlt, fällt keine Gebühr an.",
    "it": "È una piccola commissione per prenotazione pagata online: **2% nel Basic, 1,5% nel Pro, 1% nel Premium**. Finanzia il sistema anti-frode e i miglioramenti IA. Non paghi nulla se il cliente paga di persona.",
    "pt-BR": "É uma pequena comissão por reserva paga online: **2% no Basic, 1,5% no Pro, 1% no Premium**. Financia o sistema anti-fraude e as melhorias de IA. Você não paga nada se o cliente pagar presencialmente.",
    "ru": "Небольшая комиссия за онлайн-бронирование: **2% в Basic, 1,5% в Pro, 1% в Premium**. Финансирует систему антифрода и улучшения ИИ. Ничего не платите, если клиент платит наличными.",
}

# The row label sometimes needs updating too. Old label mentioned "AI Pay"
# (Basic had '—'). The row is inside the pricing plans comparison table.

def update_locale(locale: str):
    path = MESSAGES_DIR / f"{locale}.json"
    if not path.exists():
        print(f"[SKIP] {path} missing")
        return
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    # Update pricing.rows.commission row (also handles legacy pricing.features.commission)
    pricing = data.get("pricing", {})
    for container_key in ("rows", "features"):
        container = pricing.get(container_key, {})
        commission = container.get("commission") if isinstance(container, dict) else None
        if isinstance(commission, dict) and "basic" in commission:
            commission["basic"] = "2.0%"
            commission["pro"] = "1.5%"
            commission["premium"] = "1.0%"

    # Update pricing FAQ a3
    faq = pricing.get("faq", {})
    if "a3" in faq:
        faq["a3"] = NEW_FAQ_ANSWERS.get(locale, faq["a3"])

    # Some locales keep the FAQ at the top-level "faq" (full page). Update there too if present.
    top_faq = data.get("faq", {}).get("items", {})
    if isinstance(top_faq, dict):
        for _key, item in top_faq.items():
            if not isinstance(item, dict): continue
            q = item.get("q", "") or ""
            a = item.get("a", "") or ""
            if re.search(r"AI ?Pay|commission|comisi[oó]n|comiss[aã]o|Kommission|kommis|komisj|комисси", q, re.I) \
               or re.search(r"1\.5% en Pro|1,5% en Pro|1\.5 ?% Pro|1\.5%.*Pro.*1\.0%.*Premium", a, re.I):
                item["a"] = NEW_FAQ_ANSWERS.get(locale, a)

    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[OK] {locale}.json")


if __name__ == "__main__":
    for loc in ["es", "en", "fr", "de", "it", "pt-BR", "ru"]:
        update_locale(loc)
    print("Done.")
