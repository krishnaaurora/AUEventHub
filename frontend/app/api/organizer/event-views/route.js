import { NextResponse } from 'next/server'
import { ensureOrganizerEventCollections, getEventViewsCollection } from '../../_lib/db'

function toPositiveInt(value, fallback) {
  const num = Number.parseInt(value, 10)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

export async function GET(request) {
  try {
    await ensureOrganizerEventCollections()
    const collection = await getEventViewsCollection()
    const { searchParams } = new URL(request.url)

    const eventId = String(searchParams.get('event_id') || '').trim()
    const eventIds = String(searchParams.get('event_ids') || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    const limit = toPositiveInt(searchParams.get('limit'), 100)

    const query = {}
    if (eventId) {
      query.event_id = eventId
    } else if (eventIds.length > 0) {
      query.event_id = { $in: eventIds }
    }

    const items = await collection.find(query).sort({ trending_score: -1, views: -1 }).limit(limit).toArray()
    return NextResponse.json({ items })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch event views.', detail: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    await ensureOrganizerEventCollections()
    const collection = await getEventViewsCollection()
    const body = await request.json()

    const eventId = String(body.event_id || '').trim()
    const views = Number(body.views)
    const registrations = Number(body.registrations || 0)

    if (!eventId) {
      return NextResponse.json({ message: 'event_id is required.' }, { status: 400 })
    }

    if (!Number.isFinite(views) || views < 0) {
      return NextResponse.json({ message: 'views must be a non-negative number.' }, { status: 400 })
    }

    const item = {
      event_id: eventId,
      views,
      registrations: Number.isFinite(registrations) && registrations >= 0 ? registrations : 0,
      trending_score: views + (Number.isFinite(registrations) && registrations >= 0 ? registrations : 0),
      updatedAt: new Date(),
    }

    await collection.updateOne(
      { event_id: eventId },
      {
        $set: item,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    )

    return NextResponse.json({ message: 'Event views saved.', item }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to save event views.', detail: error.message },
      { status: 500 },
    )
  }
}