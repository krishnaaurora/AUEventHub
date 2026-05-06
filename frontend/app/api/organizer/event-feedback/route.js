export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ensureOrganizerEventCollections, getFeedbackCollection } from '../../_lib/db'

function toPositiveInt(value, fallback) {
  const num = Number.parseInt(value, 10)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { getEventsCollection } from '../../_lib/db'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await ensureOrganizerEventCollections()
    const collection = await getFeedbackCollection()
    const { searchParams } = new URL(request.url)

    const eventId = String(searchParams.get('event_id') || '').trim()
    const feedbackType = String(searchParams.get('feedback_type') || '').trim()
    const eventIds = String(searchParams.get('event_ids') || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    const limit = toPositiveInt(searchParams.get('limit'), 200)

    let query = {}

    // Role-based privacy
    if (session.user.role === 'organizer') {
      const organizerId = session.user.registrationId || session.user.id
      query.organizer_id = String(organizerId)
    } else {
       const organizerIdParam = String(searchParams.get('organizer_id') || '').trim()
       if (organizerIdParam) query.organizer_id = organizerIdParam
    }

    if (eventId) {
      query.event_id = eventId
    } else if (eventIds.length > 0) {
      query.event_id = { $in: eventIds }
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
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'organizer' && session.user.role !== 'admin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await ensureOrganizerEventCollections()
    const collection = await getFeedbackCollection()
    const body = await request.json()

    const eventId = String(body.event_id || '').trim()
    const organizerId = session.user.registrationId || session.user.id
    const authorName = session.user.name || session.user.email
    
    // Ownership Check
    const eventsColl = await getEventsCollection()
    const event = await eventsColl.findOne({ 
      _id: eventId.length === 24 ? new ObjectId(eventId) : eventId,
      organizer_id: String(organizerId)
    })
    if (!event) {
      return NextResponse.json({ message: 'Unauthorized to add feedback to this event.' }, { status: 403 })
    }

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
      organizer_id: String(organizerId),
      author_name: authorName,
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