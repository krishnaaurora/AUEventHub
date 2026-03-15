import { NextResponse } from 'next/server'
import { ensureOrganizerEventCollections, getEventAiDataCollection } from '../../_lib/db'

function toPositiveInt(value, fallback) {
  const num = Number.parseInt(value, 10)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

export async function GET(request) {
  try {
    await ensureOrganizerEventCollections()
    const collection = await getEventAiDataCollection()
    const { searchParams } = new URL(request.url)

    const eventId = String(searchParams.get('event_id') || '').trim()
    const organizerId = String(searchParams.get('organizer_id') || '').trim()
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
    if (organizerId) {
      query.organizer_id = organizerId
    }

    const items = await collection.find(query).sort({ updatedAt: -1 }).limit(limit).toArray()
    return NextResponse.json({ items })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch event AI data.', detail: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    await ensureOrganizerEventCollections()
    const collection = await getEventAiDataCollection()
    const body = await request.json()

    const eventId = String(body.event_id || '').trim()
    const organizerId = String(body.organizer_id || '').trim()
    const organizer = String(body.organizer || '').trim()

    if (!eventId) {
      return NextResponse.json({ message: 'event_id is required.' }, { status: 400 })
    }

    const item = {
      event_id: eventId,
      ...(organizerId ? { organizer_id: organizerId } : {}),
      ...(organizer ? { organizer } : {}),
      ...(body.inputs ? { inputs: body.inputs } : {}),
      ...(body.generated_description ? { generated_description: String(body.generated_description) } : {}),
      ...(body.description_source ? { description_source: String(body.description_source) } : {}),
      ...(body.clash_result ? { clash_result: body.clash_result } : {}),
      ...(body.approval_letter ? { approval_letter: String(body.approval_letter) } : {}),
      ...(body.approval_stage ? { approval_stage: String(body.approval_stage) } : {}),
      updatedAt: new Date(),
    }

    await collection.updateOne(
      { event_id: eventId },
      {
        $set: item,
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    return NextResponse.json({ message: 'Event AI data saved successfully.', item }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to save event AI data.', detail: error.message },
      { status: 500 },
    )
  }
}