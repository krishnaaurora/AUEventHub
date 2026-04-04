import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const title    = String(body.title      || '').trim()
    const category = String(body.category   || '').trim()
    const department = String(body.department || '').trim()
    const venue    = String(body.venue      || '').trim()

    if (!title || !category) {
      return NextResponse.json({ message: 'Title and category are required.' }, { status: 400 })
    }

    const geminiKey = process.env.GEMINI_API_KEY
    const grokKey   = process.env.GROK_API_KEY

    // Rotating styles so every call generates a meaningfully different draft
    const styles = [
      { tone: 'visionary and inspiring',  angle: 'future impact and student empowerment' },
      { tone: 'warm and community-driven', angle: 'collaboration and peer connection' },
      { tone: 'dynamic and energetic',    angle: 'live demonstrations and exciting format' },
      { tone: 'academic and prestigious', angle: 'expert knowledge and intellectual growth' },
      { tone: 'practical and results-focused', angle: 'real-world skills and career advantage' },
    ]
    const style = styles[Math.floor(Math.random() * styles.length)]
    // Extra random salt in the prompt so LLM caches cannot kick in
    const salt = Math.random().toString(36).substring(2, 8)

    const prompt = `[ref:${salt}] You are writing unique event promotional copy.
Write a ${style.tone} university event description for:

Event Title: "${title}"
Category:    ${category}
Department:  ${department || 'General'}
Venue:       ${venue || 'University Grounds'}

Angle to explore: ${style.angle}

Rules:
1. Exactly 120-150 words. Plain prose only. No bullets.
2. Open with a hook sentence that is NOT "Join us" or "Participants will".
3. Mention "${title}" by name at least once in the body.
4. End with a compelling call-to-action sentence.
5. This is draft with salt "${salt}" — make it feel completely different from any previous version.`

    // ─── Try Gemini 2.0 Flash (Primary) ──────────────────────────────
    if (geminiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 1.0,      // max creativity
                topP: 0.95,
                topK: 64,
                maxOutputTokens: 512,
              },
            }),
          }
        )
        if (res.ok) {
          const json = await res.json()
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
          if (text) {
            return NextResponse.json({ description: text, source: 'gemini-2.0-flash', style: style.tone })
          }
          console.warn('Gemini returned empty content', JSON.stringify(json))
        } else {
          const errBody = await res.text()
          console.error('Gemini error', res.status, errBody)
        }
      } catch (e) {
        console.error('Gemini fetch error', e)
      }
    }

    // ─── Try Grok (Backup) ────────────────────────────────────────────
    if (grokKey) {
      try {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${grokKey}` },
          body: JSON.stringify({
            model: 'grok-beta',
            messages: [
              { role: 'system', content: 'You are a creative university event copywriter. Never repeat yourself.' },
              { role: 'user',   content: prompt },
            ],
            temperature: 1.0,
            max_tokens: 300,
          }),
        })
        if (res.ok) {
          const json = await res.json()
          const text = json?.choices?.[0]?.message?.content?.trim()
          if (text) return NextResponse.json({ description: text, source: 'grok' })
        } else {
          console.error('Grok error', res.status)
        }
      } catch (e) {
        console.error('Grok fetch error', e)
      }
    }

    // ─── Hard fallback ────────────────────────────────────────────────
    return NextResponse.json({
      description: `"${title}" is an upcoming ${category} event${department ? ` by the ${department} department` : ''}${venue ? ` at ${venue}` : ''}. This carefully curated experience is designed to challenge your thinking, connect you with leading minds, and equip you with actionable knowledge. Whether you are looking to broaden your expertise or find your next big opportunity, this event delivers real value at every session. Come ready to engage, collaborate, and leave inspired. Seats are limited — register today to claim your place.`,
      source: 'fallback',
    })
  } catch (e) {
    console.error('ai-description unhandled error', e)
    return NextResponse.json({ message: 'Server error.', detail: e.message }, { status: 500 })
  }
}
