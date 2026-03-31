import { NextResponse } from 'next/server'

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

    const apiKey = process.env.GROK_API_KEY
    if (!apiKey) {
      console.warn('GROK_API_KEY is missing, using fallback description.')
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

    try {
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
                content: "You are a professional university event organizer assistant. Write engaging event descriptions."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 250,
          }),
        },
      )

      if (!grokResponse.ok) {
        throw new Error(`Grok API Error: ${grokResponse.status}`)
      }

      const grokJson = await grokResponse.json()
      const description = String(
        grokJson?.choices?.[0]?.message?.content || ''
      ).trim()

      if (description) {
        return NextResponse.json({ description, source: 'grok', model: 'grok-beta' })
      }
    } catch (apiError) {
      console.error('Failed to fetch from Grok API:', apiError)
    }

    return NextResponse.json({ description: buildFallbackDescription({ title, category, department, venue }), source: 'fallback' })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to generate description.', detail: error.message },
      { status: 500 }
    )
  }
}
