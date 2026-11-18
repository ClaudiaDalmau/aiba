"""One-shot script to generate a colorful hero image for the marketing site.

Replaces the current monochrome-purple `style_b_abstract_3d.png` hero with a
vibrant multi-color 3D isometric render depicting the AI-powered booking
concept (calendar + phone + chat bubbles + security shield).

Uses Gemini Nano Banana via Emergent LLM Key.
"""
import asyncio
import base64
import os
from pathlib import Path

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv("/app/backend/.env")

OUT = Path("/app/dashboard-web/public/samples/hero_light_pro.png")

PROMPT = """A refined, professional 3D isometric illustration for a premium B2B SaaS product hero banner. 16:9 landscape composition, editorial-grade quality (think Linear, Notion, Stripe, Vercel hero art).

Scene: a floating 3D calendar with visible dates, a modern smartphone showing a booking dashboard UI with subtle chat message boxes, a security shield with a padlock. All connected by thin luminous lines suggesting AI-driven automation. Around them, a few floating 3D UI elements: a euro coin, a compact chat bubble, a checkmark, a small analytics graph card.

SIZE & COMPOSITION (very important): objects must be LARGE and PROMINENT, occupying approximately 75-85% of the frame's area. Group them in the CENTER of the composition with symmetric breathing room on left and right (only ~10-12% empty space per side). Do NOT leave large dark empty areas. The phone/calendar cluster should be the visual anchor — bold and impossible to miss.

SHAPE LANGUAGE: sharp, precise, geometric. Beveled edges, subtle chamfers. Modern industrial-design feel. NOT clay, NOT overly rounded, NOT bubbly.

COLOR PALETTE — sophisticated but NOT dark/gloomy:
- BACKGROUND: soft warm off-white / pearl / cream (#F5F1EA or #FAF6EE), NOT navy, NOT black, NOT dark. Should feel airy, premium, magazine-like.
- Objects rendered in a refined palette: deep navy blue (#1E3A8A / #1E293B) for the phone/calendar bodies, warm champagne / gold (#C9A96E / #B08D57) as premium accent on the shield / coin / edges, soft muted teal (#0F766E) for chat bubbles, subtle indigo (#4338CA) for details, warm graphite gray for shadows.
- The overall image is LIGHT and inviting, with dark elements POPPING against the pale background.
- NO bright pink, NO sunny yellow, NO mint green, NO Duolingo colors.

Lighting: soft studio lighting from top-left, gentle drop shadows that ground the objects. Editorial photography feel. Warm and premium, like a Financial Times or Monocle magazine illustration.

Style keywords: professional, editorial, tech-forward, refined, restrained, sophisticated, B2B enterprise, timeless, PREMIUM, LIGHT-MODE.

Absolutely NO text, letters, numbers on the phone screen, or logos. Focus on 3D geometry and material.
"""


async def main() -> None:
    key = os.getenv("EMERGENT_LLM_KEY")
    if not key:
        raise SystemExit("EMERGENT_LLM_KEY not set")
    chat = LlmChat(api_key=key, session_id="hero-colorful-2026-08", system_message="You are an expert 3D illustrator.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    text, images = await chat.send_message_multimodal_response(UserMessage(text=PROMPT))
    if not images:
        raise SystemExit(f"No image returned. text={text!r}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(base64.b64decode(images[0]["data"]))
    print(f"Saved {OUT} ({OUT.stat().st_size} bytes) mime={images[0]['mime_type']}")


if __name__ == "__main__":
    asyncio.run(main())
