export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ensureStudentEventCollections, getEventTrendingCollection } from '../../_lib/db'
import { emitSocketEvent } from '../../../../server/socket'

function toPositiveInt(value, fallback) {
  const num = Number.parseInt(value, 10)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

export async function GET(request) {
  try {
    await ensureStudentEventCollections()
    const collection = await getEventTrendingCollection()
    const { searchParams } = new URL(request.url)
    const limit = toPositiveInt(searchParams.get('limit'), 10)

    const items = await collection.find({}).sort({ score: -1 }).limit(limit).toArray()
    return NextResponse.json({ items })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch trending events.', detail: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    await ensureStudentEventCollections()
    const collection = await getEventTrendingCollection()
    const body = await request.json()

    const eventId = String(body.event_id || '').trim()
    const score = Number(body.score)
    const reason = String(body.reason || '').trim()

    if (!eventId) {
      return NextResponse.json({ message: 'event_id is required.' }, { status: 400 })
    }

    if (!Number.isFinite(score)) {
      return NextResponse.json({ message: 'score must be a number.' }, { status: 400 })
    }

    await collection.updateOne(
      { event_id: eventId },
      {
        $set: {
          event_id: eventId,
          score,
          reason,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    const payload = {
      event_id: eventId,
      score,
      reason,
      updatedAt: new Date(),
    }

    emitSocketEvent('event-trending:updated', payload)
    emitSocketEvent('event-trending:updated', payload, `event:${eventId}`)

    return NextResponse.json({ message: 'Trending score saved.', item: payload }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to save trending score.', detail: error.message },
      { status: 500 },
    )
  }
}
