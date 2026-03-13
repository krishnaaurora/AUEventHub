import { NextResponse } from 'next/server'
import { ensureOrganizerEventCollections, getFeedbackCollection } from '../../_lib/db'

function toPositiveInt(value, fallback) {
  const num = Number.parseInt(value, 10)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

export async function GET(request) {
  try {
    await ensureOrganizerEventCollections()
    const collection = await getFeedbackCollection()
    const { searchParams } = new URL(request.url)

    const eventId = String(searchParams.get('event_id') || '').trim()
    const organizerId = String(searchParams.get('organizer_id') || '').trim()
    const feedbackType = String(searchParams.get('feedback_type') || '').trim()
    const eventIds = String(searchParams.get('event_ids') || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    const limit = toPositiveInt(searchParams.get('limit'), 200)

    const query = {}
    if (eventId) {
      query.event_id = eventId
    } else if (eventIds.length > 0) {
      query.event_id = { $in: eventIds }
    }
    if (organizerId) {
      query.organizer_id = organizerId
    }
    if (feedbackType) {
      query.feedback_type = feedbackType
    }

    const items = await collection.find(query).sort({ createdAt: -1, created_at: -1 }).limit(limit).toArray()

    const summaryByEvent = items.reduce((acc, item) => {
      const key = String(item.event_id)
      const rating = Number(item.rating)
      if (!acc[key]) {
        acc[key] = { count: 0, ratingCount: 0, ratingTotal: 0, organizerNotes: 0 }
      }
      acc[key].count += 1
      if (item.feedback_type === 'organizer_note') {
        acc[key].organizerNotes += 1
      }
      if (Number.isFinite(rating) && rating > 0) {
        acc[key].ratingCount += 1
        acc[key].ratingTotal += rating
      }
      return acc
    }, {})

    Object.values(summaryByEvent).forEach((summary) => {
      summary.averageRating = summary.ratingCount > 0
        ? Number((summary.ratingTotal / summary.ratingCount).toFixed(1))
        : null
    })

    return NextResponse.json({ items, summaryByEvent })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch event feedback.', detail: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    await ensureOrganizerEventCollections()
    const collection = await getFeedbackCollection()
    const body = await request.json()

    const eventId = String(body.event_id || '').trim()
    const organizerId = String(body.organizer_id || '').trim()
    const authorName = String(body.author_name || '').trim()
    const comment = String(body.comment || '').trim()
    const feedbackType = String(body.feedback_type || 'organizer_note').trim()
    const ratingValue = body.rating === '' || body.rating === null || body.rating === undefined
      ? null
      : Number(body.rating)

    if (!eventId || !comment) {
      return NextResponse.json(
        { message: 'event_id and comment are required.' },
        { status: 400 },
      )
    }

    if (ratingValue !== null && (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5)) {
      return NextResponse.json({ message: 'rating must be between 1 and 5.' }, { status: 400 })
    }

    const item = {
      event_id: eventId,
      ...(organizerId ? { organizer_id: organizerId } : {}),
      ...(authorName ? { author_name: authorName } : {}),
      feedback_type: feedbackType,
      ...(ratingValue !== null ? { rating: ratingValue } : {}),
      comment,
      created_at: new Date().toISOString().slice(0, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(item)

    return NextResponse.json(
      { message: 'Event feedback saved successfully.', id: result.insertedId, item },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to save event feedback.', detail: error.message },
      { status: 500 },
    )
  }
}