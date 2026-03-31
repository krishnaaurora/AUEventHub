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
import redis from '../../../../lib/redis'

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
    const limit = 20 // Enforced 20-item limit for performance
    const page = toPositiveInt(searchParams.get('page'), 1)

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

    const cacheKey = `events_dean_${filter}_${page}_${limit}`
    
    // 1. Try Cache First
    if (redis && redis.isReady) {
      const cached = await redis.get(cacheKey)
      if (cached) {
        // Return instantly
        const parsed = JSON.parse(cached)
        // BACKGROUND REFRESH (Async)
        // Only refresh if cache is older than 30s (we store metadata in the cache for this)
        if (!parsed._timestamp || Date.now() - parsed._timestamp > 30000) {
          console.log("♻️ Background Refresh Triggered")
          // No await here
          fetchEventsAndCache(eventsCol, statusQuery, filter, page, limit, cacheKey)
        }
        return NextResponse.json(parsed)
      }
    }

    // 2. Cold Start: Fetch fresh
    console.time("API_COLD_FETCH")
    const responseData = await fetchEventsAndCache(eventsCol, statusQuery, filter, page, limit, cacheKey)
    console.timeEnd("API_COLD_FETCH")

    return NextResponse.json(responseData)
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch dean events.', detail: error.message },
      { status: 500 }
    )
  }
}

// Extracted for re-use in background update
async function fetchEventsAndCache(eventsCol, statusQuery, filter, page, limit, cacheKey) {
  const pipeline = [
    { $match: statusQuery },
    { $sort: { created_at: -1, _id: -1 } },
    {
      $lookup: {
        from: "event_approvals",
        let: { e_id: { $toString: "$_id" } },
        pipeline: [
          { $match: { $expr: { $eq: ["$event_id", "$$e_id"] } } }
        ],
        as: "approvalDocs"
      }
    },
    {
      $addFields: {
        approval: { $arrayElemAt: ["$approvalDocs", 0] }
      }
    },
    {
      $project: {
        approvalDocs: 0
      }
    }
  ]

  if (filter === 'approved') {
    pipeline.push({ $match: { "approval.dean_status": "approved" } })
  } else if (filter === 'rejected') {
    pipeline.push({ $match: { "approval.dean_status": "rejected" } })
  }

  pipeline.push({ $skip: (page - 1) * limit })
  pipeline.push({ $limit: limit })

  const events = await eventsCol.aggregate(pipeline).toArray()

  const items = events.map((e) => ({
    ...e,
    _id: String(e._id),
    approval: e.approval || null,
  }))

  const responseData = { 
    items, 
    _timestamp: Date.now(), 
    _source: 'cache' 
  }

  try {
    if (redis && redis.isReady) {
      await redis.set(cacheKey, JSON.stringify(responseData), "EX", 60)
    }
  } catch (e) { /* ignore */ }

  return responseData
}
