export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ensureOrganizerEventCollections, getEventApprovalsCollection } from '../../_lib/db'

function toPositiveInt(value, fallback) {
  const num = Number.parseInt(value, 10)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

export async function GET(request) {
  try {
    await ensureOrganizerEventCollections()
    const collection = await getEventApprovalsCollection()
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

    const items = await collection.find(query).sort({ updatedAt: -1, submitted_at: -1 }).limit(limit).toArray()
    return NextResponse.json({ items })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch event approvals.', detail: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    await ensureOrganizerEventCollections()
    const collection = await getEventApprovalsCollection()
    const body = await request.json()

    const eventId = String(body.event_id || '').trim()
    if (!eventId) {
      return NextResponse.json({ message: 'event_id is required.' }, { status: 400 })
    }

    const item = {
      event_id: eventId,
      dean_status: String(body.dean_status || 'pending').trim(),
      registrar_status: String(body.registrar_status || 'pending').trim(),
      vc_status: String(body.vc_status || 'pending').trim(),
      submitted_at: String(body.submitted_at || new Date().toISOString().slice(0, 10)).trim(),
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

    return NextResponse.json({ message: 'Event approvals saved.', item }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to save event approvals.', detail: error.message },
      { status: 500 },
    )
  }
}