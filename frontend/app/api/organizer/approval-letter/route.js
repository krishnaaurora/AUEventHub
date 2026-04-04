import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const title = String(body.title || '').trim()
    const category = String(body.category || '').trim()
    const department = String(body.department || '').trim()
    const venue = String(body.venue || '').trim()
    const startDate = String(body.start_date || '').trim()
    const endDate = String(body.end_date || '').trim()
    const startTime = String(body.start_time || '').trim()
    const endTime = String(body.end_time || '').trim()
    const organizer = String(body.organizer || '').trim()
    const description = String(body.description || '').trim()
    const maxParticipants = body.max_participants || 'N/A'
    const guestSpeakers = String(body.guest_speakers || 'None').trim()

    if (!title || !category || !venue || !startDate) {
      return NextResponse.json(
        { message: 'Title, category, venue, and start date are required.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GROK_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY

    const prompt = `Draft a formal, professional university event approval request letter addressed to the Dean of Student Affairs, Aurora University.
Event details:
Title: ${title}
Category: ${category}
Department: ${department || 'General'}
Venue: ${venue}
Schedule: ${startDate} ${startTime} - ${endDate || startDate} ${endTime}
Organizer: ${organizer || 'Event Organizer'}
Expected Participants: ${maxParticipants}
Guest Speakers: ${guestSpeakers}
Abstract: ${description || 'N/A'}

Instructions: 
- Stay professional and convincing. 
- Do NOT use repetitive words. 
- Each letter should be a unique creation starting with a formal header. 
- Focus and highlight the importance of "${title}" for students.`

    // Try Gemini Primary
    if (geminiKey) {
      try {
        console.log('DEBUG: Letter Gemini generation...')
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.9, maxOutputTokens: 1000 }
            })
          }
        )

        if (geminiRes.ok) {
          const json = await geminiRes.json()
          const letter = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
          if (letter) {
            console.log('DEBUG: Letter Gemini Success!')
            return NextResponse.json({ letter, source: 'gemini' })
          }
        }
      } catch (err) {
        console.error('DEBUG: Letter Gemini Error:', err)
      }
    }

    // Try Grok Backup
    if (apiKey) {
      console.log('DEBUG: Letter Grok starting with:', apiKey.substring(0, 8))
      try {
        const grokRes = await fetch('https://api.x.ai/v1/chat/completions', {
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
                content: "You are a senior university administrative assistant. Write formal, convincing, and highly UNIQUE approval letters. Do not use repetitive templates."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.92
          })
        })

        if (grokRes.ok) {
          const json = await grokRes.json()
          const content = json.choices[0].message.content
          if (content) {
            return NextResponse.json({ letter: content, source: 'grok' })
          }
        }
      } catch (err) {
        console.error('DEBUG: Letter Grok Connection Error:', err)
      }
    }

    // Fallback template
    const dateStr = endDate && endDate !== startDate ? `${startDate} to ${endDate}` : startDate
    const timeStr = endTime && endTime !== startTime ? `${startTime} to ${endTime}` : startTime || 'TBD'
    const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

    const letter = `APPROVAL REQUEST LETTER
Date: ${today}

To,
The Dean of Student Affairs
Aurora University

Subject: Request for Approval to Conduct "${title}"

Respected Sir/Madam,
I, ${organizer || '[Organizer]'}, am writing to formally request approval to organize "${title}" under the ${category} category${department ? ` for ${department}` : ''}.

Details:
- Venue: ${venue}
- Schedule: ${dateStr} (${timeStr})
- Speakers: ${guestSpeakers}
- Expected Seats: ${maxParticipants}

Description:
${description || 'Enhancing student engagement and practical learning.'}

I request your approval to proceed with the preparations. All necessary arrangements will be managed by the organizing committee in compliance with university guidelines.

Yours sincerely,
${organizer || '[Organizer Name]'}
Event Organizer`

    return NextResponse.json({ letter, source: 'fallback' })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to generate approval letter.', detail: error.message },
      { status: 500 }
    )
  }
}
