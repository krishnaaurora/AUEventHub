import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { message } = await req.json()
    const apiKey = process.env.GROK_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        reply: "I'm currently in offline mode. How can I help you with AUEventHub features today?"
      })
    }

    const grokResponse = await fetch(
      'https://api.x.ai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "grok-beta",
          messages: [
            {
              role: "system",
              content: `You are RIYA, a smart AI assistant for AUEventHub platform.

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
3. Use simple text, no markdown like bold or bullet points.`
            },
            {
              role: "user",
              content: message
            }
          ],
          temperature: 0.5, // Lower temperature for more controlled/consistent answers
          max_tokens: 200,
        }),
      }
    )

    if (!grokResponse.ok) {
      throw new Error(`Grok API Error: ${grokResponse.status}`)
    }

    const grokJson = await grokResponse.json()
    const reply = String(grokJson?.choices?.[0]?.message?.content || '').trim()

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat API Error:', error)
    return NextResponse.json({
      reply: "I'm having trouble connecting right now. Please try again later."
    }, { status: 500 })
  }
}
