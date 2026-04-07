"""
Gemini + Grok AI service.
All LLM calls are isolated here — swap providers without touching routes.
"""
import os
import random
import requests
from dotenv import load_dotenv

load_dotenv()

GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
GROK_KEY   = os.getenv("GROK_API_KEY", "")

GEMINI_FLASH_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.0-flash:generateContent"
)
GROK_URL = "https://api.x.ai/v1/chat/completions"


# ── Gemini helper ────────────────────────────────────────────────────────────

def _call_gemini(prompt: str, temperature: float = 1.0, max_tokens: int = 512) -> str | None:
    """Call Gemini 2.0 Flash. Returns text or None on failure."""
    if not GEMINI_KEY:
        return None
    try:
        resp = requests.post(
            f"{GEMINI_FLASH_URL}?key={GEMINI_KEY}",
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": temperature,
                    "topP": 0.95,
                    "topK": 64,
                    "maxOutputTokens": max_tokens,
                },
            },
            timeout=20,
        )
        resp.raise_for_status()
        return (
            resp.json()
            .get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
            .strip() or None
        )
    except Exception as e:
        print(f"[Gemini Error] {e}")
        return None


# ── Grok helper ──────────────────────────────────────────────────────────────

def _call_grok(
    system: str, user: str, temperature: float = 0.7, max_tokens: int = 300
) -> str | None:
    """Call Grok v1. Returns text or None on failure."""
    if not GROK_KEY:
        return None
    try:
        resp = requests.post(
            GROK_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {GROK_KEY}",
            },
            json={
                "model": "grok-beta",
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user",   "content": user},
                ],
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
            timeout=20,
        )
        resp.raise_for_status()
        return (
            resp.json()
            .get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip() or None
        )
    except Exception as e:
        print(f"[Grok Error] {e}")
        return None


# ── Public AI functions ──────────────────────────────────────────────────────

STYLES = [
    {"tone": "visionary and inspiring",      "angle": "future impact and student empowerment"},
    {"tone": "warm and community-driven",    "angle": "collaboration and peer connection"},
    {"tone": "dynamic and energetic",        "angle": "live demonstrations and exciting format"},
    {"tone": "academic and prestigious",     "angle": "expert knowledge and intellectual growth"},
    {"tone": "practical and results-focused","angle": "real-world skills and career advantage"},
]


def generate_event_description(title: str, category: str, department: str = "", venue: str = "") -> dict:
    """Generate a unique event description using Gemini → Grok → fallback."""
    style = random.choice(STYLES)
    salt  = format(random.randint(0, 0xFFFFFF), "06x")

    prompt = f"""[ref:{salt}] You are writing unique event promotional copy.
Write a {style['tone']} university event description for:

Event Title: "{title}"
Category:    {category}
Department:  {department or 'General'}
Venue:       {venue or 'University Grounds'}

Angle to explore: {style['angle']}

Rules:
1. Exactly 120-150 words. Plain prose only. No bullets.
2. Open with a hook sentence that is NOT "Join us" or "Participants will".
3. Mention "{title}" by name at least once in the body.
4. End with a compelling call-to-action sentence.
5. This is draft with salt "{salt}" — make it feel completely different from any previous version."""

    text = _call_gemini(prompt, temperature=1.0, max_tokens=512)
    if text:
        return {"description": text, "source": "gemini-2.0-flash", "style": style["tone"]}

    text = _call_grok(
        system="You are a creative university event copywriter. Never repeat yourself.",
        user=prompt,
        temperature=1.0,
        max_tokens=300,
    )
    if text:
        return {"description": text, "source": "grok", "style": style["tone"]}

    # Hard fallback
    fallback = (
        f'"{title}" is an upcoming {category} event'
        + (f" by the {department} department" if department else "")
        + (f" at {venue}" if venue else "")
        + ". This carefully curated experience is designed to challenge your thinking, "
        "connect you with leading minds, and equip you with actionable knowledge. "
        "Whether you are looking to broaden your expertise or find your next big opportunity, "
        "this event delivers real value at every session. "
        "Come ready to engage, collaborate, and leave inspired. "
        "Seats are limited — register today to claim your place."
    )
    return {"description": fallback, "source": "fallback"}


def generate_approval_letter(
    title: str, category: str, department: str, venue: str,
    start_date: str, end_date: str, start_time: str, end_time: str,
    organizer: str, description: str, max_participants, guest_speakers: str,
) -> dict:
    """Generate a formal approval request letter via Gemini → Grok → template fallback."""
    prompt = f"""Draft a formal, professional university event approval request letter addressed to the Dean of Student Affairs, Aurora University.
Event details:
Title: {title}
Category: {category}
Department: {department or 'General'}
Venue: {venue}
Schedule: {start_date} {start_time} - {end_date or start_date} {end_time}
Organizer: {organizer or 'Event Organizer'}
Expected Participants: {max_participants or 'N/A'}
Guest Speakers: {guest_speakers or 'None'}
Abstract: {description or 'N/A'}

Instructions:
- Stay professional and convincing.
- Do NOT use repetitive words.
- Each letter should be a unique creation starting with a formal header.
- Focus and highlight the importance of "{title}" for students."""

    text = _call_gemini(prompt, temperature=0.9, max_tokens=1000)
    if text:
        return {"letter": text, "source": "gemini"}

    text = _call_grok(
        system=(
            "You are a senior university administrative assistant. "
            "Write formal, convincing, and highly UNIQUE approval letters. "
            "Do not use repetitive templates."
        ),
        user=prompt,
        temperature=0.92,
        max_tokens=600,
    )
    if text:
        return {"letter": text, "source": "grok"}

    # Template fallback
    from datetime import date
    today = date.today().strftime("%d %B %Y")
    date_str = f"{start_date} to {end_date}" if end_date and end_date != start_date else start_date
    time_str = f"{start_time} to {end_time}" if end_time and end_time != start_time else start_time or "TBD"

    letter = f"""APPROVAL REQUEST LETTER
Date: {today}

To,
The Dean of Student Affairs
Aurora University

Subject: Request for Approval to Conduct "{title}"

Respected Sir/Madam,
I, {organizer or '[Organizer]'}, am writing to formally request approval to organize "{title}" under the {category} category{f' for {department}' if department else ''}.

Details:
- Venue: {venue}
- Schedule: {date_str} ({time_str})
- Speakers: {guest_speakers or 'None'}
- Expected Seats: {max_participants or 'N/A'}

Description:
{description or 'Enhancing student engagement and practical learning.'}

I request your approval to proceed with the preparations. All necessary arrangements will be managed by the organizing committee in compliance with university guidelines.

Yours sincerely,
{organizer or '[Organizer Name]'}
Event Organizer"""

    return {"letter": letter, "source": "fallback"}


def chat_with_riya(message: str) -> dict:
    """RIYA AI chat — answers AUEventHub platform questions."""
    system = """You are RIYA, a smart AI assistant for AUEventHub platform.

Only answer questions related to:
- Event discovery and features
- Organizer dashboard and event creation
- Approval workflow (Dean and Vice Chancellor)
- Student registration and participation
- Attendance tracking
- Certificates and analytics
- Platform technical support

Strict Guidelines:
1. If the user asks about anything outside these campus-related topics, politely refuse by saying: "I can only answer questions related to the AUEventHub platform."
2. Keep responses brief, professional, and helpful for university students/faculty.
3. Use simple text only."""

    text = _call_grok(system=system, user=message, temperature=0.5, max_tokens=200)
    if text:
        return {"reply": text, "source": "grok"}

    text = _call_gemini(f"{system}\n\nUser: {message}", temperature=0.5, max_tokens=256)
    if text:
        return {"reply": text, "source": "gemini"}

    return {
        "reply": "I'm having trouble connecting right now. Please try again later.",
        "source": "offline",
    }
