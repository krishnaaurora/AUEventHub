import { NextResponse } from 'next/server'
import {
  ensureStudentEventCollections,
  getEventsCollection,
  getEventApprovalsCollection,
  getEventDetailsCollection,
  getEventAiDataCollection,
  getEventTrendingCollection,
} from '../../_lib/db'
import { requireDeanAccess } from '../_lib/auth'

function toPositiveInt(value, fallback) {
  const num = Number.parseInt(value, 10)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

export async function GET(request) {
  try {
    const auth = await requireDeanAccess()
    if (auth.response) return auth.response

    await ensureStudentEventCollections()
    const eventsCol = await getEventsCollection()
    const approvalsCol = await getEventApprovalsCollection()
    const detailsCol = await getEventDetailsCollection()
    const aiDataCol = await getEventAiDataCollection()
    const trendingCol = await getEventTrendingCollection()

    const { searchParams } = new URL(request.url)
    const filter = String(searchParams.get('filter') || '').trim()
    const eventId = String(searchParams.get('event_id') || '').trim()
    const limit = toPositiveInt(searchParams.get('limit'), 100)

    // Single event detail view
    if (eventId) {
      const event = await eventsCol.findOne({
        $or: [{ _id: eventId }, ...(eventId.length === 24 ? [{ _id: (() => { try { const { ObjectId } = require('mongodb'); return new ObjectId(eventId) } catch { return eventId } })() }] : [])],
      })
      if (!event) {
        return NextResponse.json({ message: 'Event not found.' }, { status: 404 })
      }
      const eid = String(event._id)
      const [detail, approval, aiData, trending] = await Promise.all([
        detailsCol.findOne({ event_id: eid }),
        approvalsCol.findOne({ event_id: eid }),
        aiDataCol.findOne({ event_id: eid }),
        trendingCol.findOne({ event_id: eid }),
      ])
      return NextResponse.json({
        event: { ...event, _id: eid },
        detail,
        approval,
        aiData,
        trending,
      })
    }

    // Build status query based on filter
    let statusQuery = {}
    if (filter === 'pending') {
      statusQuery = { status: { $in: ['pending_dean', 'pending'] } }
    } else if (filter === 'approved') {
      statusQuery = {
        status: { $in: ['pending_registrar', 'pending_vc', 'approved', 'published', 'completed'] },
      }
    } else if (filter === 'rejected') {
      statusQuery = { status: 'rejected' }
    }

    const events = await eventsCol
      .find(statusQuery)
      .sort({ created_at: -1, _id: -1 })
      .limit(limit)
      .toArray()

    const eventIds = events.map((e) => String(e._id))

    let approvalsMap = {}
    if (eventIds.length > 0) {
      const approvals = await approvalsCol
        .find({ event_id: { $in: eventIds } })
        .toArray()
      approvalsMap = approvals.reduce((acc, a) => {
        acc[a.event_id] = a
        return acc
      }, {})
    }

    // For filtered views, further filter by dean_status
    let items = events.map((e) => ({
      ...e,
      _id: String(e._id),
      approval: approvalsMap[String(e._id)] || null,
    }))

    if (filter === 'approved') {
      items = items.filter(
        (e) => e.approval?.dean_status === 'approved'
      )
    } else if (filter === 'rejected') {
      items = items.filter(
        (e) => e.approval?.dean_status === 'rejected'
      )
    }

    return NextResponse.json({ items })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch dean events.', detail: error.message },
      { status: 500 }
    )
  }
}
