export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ensureOrganizerEventCollections, getEventAiDataCollection } from '../../_lib/db'

function toPositiveInt(value, fallback) {
  const num = Number.parseInt(value, 10)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await ensureOrganizerEventCollections()
    const collection = await getEventAiDataCollection()
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

    // Role-based privacy
    if (session.user.role === 'organizer') {
      const organizerId = session.user.registrationId || session.user.id
      query.organizer_id = String(organizerId)
    } else if (searchParams.get('organizer_id')) {
      query.organizer_id = String(searchParams.get('organizer_id'))
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
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'organizer' && session.user.role !== 'admin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await ensureOrganizerEventCollections()
    const collection = await getEventAiDataCollection()
    const body = await request.json()

    const eventId = String(body.event_id || '').trim()
    const organizerId = session.user.registrationId || session.user.id
    const organizerName = session.user.name || session.user.email

    if (!eventId) {
      return NextResponse.json({ message: 'event_id is required.' }, { status: 400 })
    }

    const item = {
      event_id: eventId,
      organizer_id: String(organizerId),
      organizer: organizerName,
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