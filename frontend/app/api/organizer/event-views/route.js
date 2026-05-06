export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ensureOrganizerEventCollections, getEventViewsCollection } from '../../_lib/db'

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
    const collection = await getEventViewsCollection()
    const { searchParams } = new URL(request.url)

    const eventId = String(searchParams.get('event_id') || '').trim()
    const eventIds = String(searchParams.get('event_ids') || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    const limit = toPositiveInt(searchParams.get('limit'), 100)

    let query = {}
    
    // Privacy Enforcement for Organizers
    if (session.user.role === 'organizer') {
      const organizerId = session.user.registrationId || session.user.id
      const eventsColl = await getEventsCollection()
      
      const idsToVerify = eventId ? [eventId] : eventIds
      if (idsToVerify.length === 0) {
        return NextResponse.json({ items: [] })
      }

      // Check which of these events belong to the organizer
      const myEvents = await eventsColl.find({
        organizer_id: String(organizerId)
      }, { projection: { _id: 1 } }).toArray()
      
      const myEventIdSet = new Set(myEvents.map(e => String(e._id)))
      const authorizedIds = idsToVerify.filter(id => myEventIdSet.has(id))
      
      if (authorizedIds.length === 0) {
        return NextResponse.json({ items: [] })
      }
      query.event_id = { $in: authorizedIds }
    } else {
      if (eventId) {
        query.event_id = eventId
      } else if (eventIds.length > 0) {
        query.event_id = { $in: eventIds }
      }
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
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'organizer' && session.user.role !== 'admin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    await ensureOrganizerEventCollections()
    const collection = await getEventViewsCollection()
    const body = await request.json()

    const eventId = String(body.event_id || '').trim()
    
    // Ownership Check
    if (session.user.role === 'organizer') {
       const organizerId = session.user.registrationId || session.user.id
       const eventsColl = await getEventsCollection()
       const event = await eventsColl.findOne({ 
         _id: eventId.length === 24 ? new ObjectId(eventId) : eventId,
         organizer_id: String(organizerId)
       })
       if (!event) {
         return NextResponse.json({ message: 'Unauthorized to update this event view data.' }, { status: 403 })
       }
    }

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