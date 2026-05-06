export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ensureStudentEventCollections, getEventDetailsCollection } from '../../_lib/db'
import { emitSocketEvent } from '../../../../server/socket'

export async function GET(request) {
  try {
    await ensureStudentEventCollections()
    const detailsCollection = await getEventDetailsCollection()
    const { searchParams } = new URL(request.url)
    const eventId = String(searchParams.get('event_id') || '').trim()

    if (!eventId) {
      return NextResponse.json({ message: 'event_id is required.' }, { status: 400 })
    }

    const item = await detailsCollection.findOne({ event_id: eventId })

    if (!item) {
      return NextResponse.json({ message: 'Event details not found.' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch event details.', detail: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    await ensureStudentEventCollections()
    const detailsCollection = await getEventDetailsCollection()
    const body = await request.json()

    const eventId = String(body.event_id || '').trim()
    if (!eventId) {
      return NextResponse.json({ message: 'event_id is required.' }, { status: 400 })
    }

    const speakers = Array.isArray(body.speakers) ? body.speakers : []
    const schedule = Array.isArray(body.schedule) ? body.schedule : []
    const instructions = String(body.instructions || '').trim()

    await detailsCollection.updateOne(
      { event_id: eventId },
      {
        $set: {
          event_id: eventId,
          speakers,
          schedule,
          instructions,
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
      speakers,
      schedule,
      instructions,
      updatedAt: new Date(),
    }

    emitSocketEvent('event-details:updated', payload)
    emitSocketEvent('event-details:updated', payload, `event:${eventId}`)

    return NextResponse.json({ message: 'Event details saved successfully.', item: payload }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to save event details.', detail: error.message },
      { status: 500 },
    )
  }
}
