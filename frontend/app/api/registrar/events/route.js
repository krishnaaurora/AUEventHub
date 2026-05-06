export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import {
  ensureStudentEventCollections,
  getEventsCollection,
  getEventApprovalsCollection,
  getEventDetailsCollection,
  getEventAiDataCollection,
  getEventTrendingCollection,
} from '../../_lib/db'
import { requireRegistrarAccess } from '../_lib/auth'

function toPositiveInt(value, fallback) {
  const num = Number.parseInt(value, 10)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

export async function GET(request) {
  try {
    const auth = await requireRegistrarAccess()
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

    // Build match conditions
    let approvalMatch = {}
    let eventMatch = {}

    if (filter === 'pending') {
      eventMatch = { status: 'pending_registrar' }
    } else if (filter === 'approved') {
      approvalMatch = { registrar_status: 'approved' }
    } else if (filter === 'rejected') {
      approvalMatch = { registrar_status: 'rejected' }
    }

    let events = []
    let approvals = []

    if (Object.keys(approvalMatch).length > 0) {
      // Filtered mode: Find approvals first then join events
      approvals = await approvalsCol.find(approvalMatch).sort({ updatedAt: -1 }).toArray()
      const eventIds = approvals.map(a => String(a.event_id))
      const { ObjectId } = require('mongodb')
      const objectIds = eventIds.map(id => { try { return new ObjectId(id) } catch { return null } }).filter(Boolean)
      
      events = await eventsCol.find({
        $or: [
          { _id: { $in: eventIds } },
          ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : [])
        ]
      }).toArray()
    } else {
      // Standard mode (likely pending): Find events first
      events = await eventsCol.find(eventMatch).sort({ created_at: -1, _id: -1 }).limit(limit).toArray()
      const eventIds = events.map(e => String(e._id))
      approvals = await approvalsCol.find({ event_id: { $in: eventIds } }).toArray()
    }

    // Build Maps
    const eventsMap = {}
    events.forEach(e => { eventsMap[String(e._id)] = e })

    const approvalsMap = {}
    approvals.forEach(a => { approvalsMap[String(a.event_id)] = a })

    // Assemble final list
    let finalItems = []
    if (Object.keys(approvalMatch).length > 0) {
      // Map based on approvals to ensure we only show what was actually actioned by registrar
      finalItems = approvals.map(a => {
        const e = eventsMap[String(a.event_id)]
        if (!e) return null
        return {
          ...e,
          _id: String(e._id),
          approval: a
        }
      }).filter(Boolean)
    } else {
      // Map based on events (likely for pending list)
      finalItems = events.map(e => ({
        ...e,
        _id: String(e._id),
        approval: approvalsMap[String(e._id)] || null
      }))
    }

    return NextResponse.json({ items: finalItems })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch registrar events.', detail: error.message },
      { status: 500 }
    )
  }
}