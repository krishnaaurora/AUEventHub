import { ensureStudentEventCollections, getEventsCollection } from '../../../_lib/db'
import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

/**
 * GET /api/student/events/[id]
 * Fetches details for a single event by its ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = params
    if (!id) {
      return NextResponse.json({ message: 'Event ID is required.' }, { status: 400 })
    }

    await ensureStudentEventCollections()
    const eventsCollection = await getEventsCollection()

    let filter
    try {
      filter = { _id: new ObjectId(id) }
    } catch {
      // In case the ID is not a valid ObjectId (could be a custom string ID)
      filter = { _id: id }
    }

    const event = await eventsCollection.findOne(filter)

    if (!event) {
      return NextResponse.json({ message: 'Event not found.' }, { status: 404 })
    }

    // Normalize _id to string
    const normalizedEvent = {
      ...event,
      _id: String(event._id)
    }

    return NextResponse.json(normalizedEvent)
  } catch (error) {
    console.error(`[STUDENT EVENT GET ${params?.id}] Error:`, error)
    return NextResponse.json(
      { message: 'Failed to fetch event details.', detail: error.message },
      { status: 500 }
    )
  }
}
