export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import {
  ensureStudentEventCollections,
  getEventTrendingCollection,
  getEventViewsCollection,
  getEventsCollection,
} from '../../_lib/db'
import { emitSocketEvent } from '../../../../server/socket'

export async function POST(request) {
  try {
    await ensureStudentEventCollections()
    const viewsCollection = await getEventViewsCollection()
    const trendingCollection = await getEventTrendingCollection()
    const eventsCollection = await getEventsCollection()
    const body = await request.json()

    const eventId = String(body.event_id || '').trim()
    if (!eventId) {
      return NextResponse.json({ message: 'event_id is required.' }, { status: 400 })
    }

    const [event, updatedView] = await Promise.all([
      eventsCollection.findOne({ _id: eventId }),
      viewsCollection.findOneAndUpdate(
        { event_id: eventId },
        { 
          $inc: { views: 1 },
          $set: { updatedAt: new Date() },
          $setOnInsert: { event_id: eventId, registrations: 0, createdAt: new Date() }
        },
        { upsert: true, returnDocument: 'after' }
      )
    ])

    if (!event) {
      return NextResponse.json({ message: 'Event not found.' }, { status: 404 })
    }

    const views = Number(updatedView?.views || 0)
    const registrations = Number(event.registered_count || updatedView?.registrations || 0)
    const trendingScore = views + registrations

    // Parallelize the second set of updates
    await Promise.all([
      viewsCollection.updateOne(
        { event_id: eventId },
        { $set: { registrations, trending_score: trendingScore, updatedAt: new Date() } }
      ),
      trendingCollection.updateOne(
        { event_id: eventId },
        {
          $set: {
            event_id: eventId,
            score: trendingScore,
            trending_score: trendingScore,
            reason: 'Auto-updated from student page views and registrations',
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      )
    ])

    const payload = {
      event_id: eventId,
      views,
      registrations,
      trending_score: trendingScore,
    }

    emitSocketEvent('event-views:updated', payload)
    emitSocketEvent('dashboard:refresh', { scope: 'organizer', type: 'event-views' }, 'role:organizer')

    return NextResponse.json({ message: 'Event view recorded.', item: payload }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to record event view.', detail: error.message },
      { status: 500 },
    )
  }
}