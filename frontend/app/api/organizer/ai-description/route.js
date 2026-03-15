import { NextResponse } from 'next/server'

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']

function buildFallbackDescription({ title, category, department, venue }) {
  const departmentLine = department ? ` organized by the ${department} department` : ''
  const venueLine = venue ? ` at ${venue}` : ''

  return `Join us for "${title}", an exciting ${category.toLowerCase()} event${departmentLine}${venueLine}. ` +
    `This event is designed to bring together students, faculty, and industry experts for a day of learning, networking, and collaboration. ` +
    `Participants will get hands-on experience, engage in interactive sessions, and gain valuable insights into the latest trends in ${category.toLowerCase()}. ` +
    `Whether you're a beginner or an expert, this event has something for everyone. ` +
    `Don't miss this opportunity to expand your knowledge and connect with like-minded peers. Register now to secure your spot!`
}

export async function POST(request) {
  try {
    const body = await request.json()
    const title = String(body.title || '').trim()
    const category = String(body.category || '').trim()
    const department = String(body.department || '').trim()
    const venue = String(body.venue || '').trim()

    if (!title || !category) {
      return NextResponse.json(
        { message: 'Title and category are required.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ description: buildFallbackDescription({ title, category, department, venue }), source: 'fallback' })
    }

    const prompt = [
      'Write a concise, polished university event description in 110 to 150 words.',
      'Keep it professional and engaging for students.',
      'Do not use bullet points or markdown.',
      `Title: ${title}`,
      `Category: ${category}`,
      `Department: ${department || 'Not specified'}`,
      `Venue: ${venue || 'Not specified'}`,
    ].join('\n')

    for (const model of GEMINI_MODELS) {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 220,
            },
          }),
        },
      )

      const geminiJson = await geminiResponse.json()
      const description = String(
        geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      ).trim()

      if (geminiResponse.ok && description) {
        return NextResponse.json({ description, source: 'gemini', model })
      }
    }

    return NextResponse.json({ description: buildFallbackDescription({ title, category, department, venue }), source: 'fallback' })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to generate description.', detail: error.message },
      { status: 500 }
    )
  }
}
