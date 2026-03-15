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

    const event = await eventsCollection.findOne({ _id: eventId })
    if (!event) {
      return NextResponse.json({ message: 'Event not found.' }, { status: 404 })
    }

    await viewsCollection.updateOne(
      { event_id: eventId },
      {
        $inc: { views: 1 },
        $setOnInsert: {
          event_id: eventId,
          registrations: Number(event.registered_count || 0),
          createdAt: new Date(),
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true },
    )

    const updatedView = await viewsCollection.findOne({ event_id: eventId })
    const views = Number(updatedView?.views || 0)
    const registrations = Number(event.registered_count || updatedView?.registrations || 0)
    const trendingScore = views + registrations

    await viewsCollection.updateOne(
      { event_id: eventId },
      {
        $set: {
          registrations,
          trending_score: trendingScore,
          updatedAt: new Date(),
        },
      },
    )

    await trendingCollection.updateOne(
      { event_id: eventId },
      {
        $set: {
          event_id: eventId,
          score: trendingScore,
          trending_score: trendingScore,
          reason: 'Auto-updated from student page views and registrations',
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