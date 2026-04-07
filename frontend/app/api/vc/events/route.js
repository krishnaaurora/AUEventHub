import { NextResponse } from 'next/server'
import {
  ensureStudentEventCollections,
  getEventsCollection,
  getEventApprovalsCollection,
  getEventDetailsCollection,
  getEventAiDataCollection,
  getEventTrendingCollection,
} from '../../_lib/db'
import { requireVCAccess } from '../_lib/auth'
import redis from '../../../../lib/redis'

function toPositiveInt(value, fallback) {
  const num = Number.parseInt(value, 10)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

export async function GET(request) {
  try {
    const auth = await requireVCAccess()
    if (auth.response) return auth.response

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const limit = toPositiveInt(searchParams.get('limit'), 50)
    const offset = toPositiveInt(searchParams.get('offset'), 0)

    const cacheKey = `events:vc:${filter}:${limit}:${offset}`

    if (redis && redis.isReady) {
      const cached = await redis.get(cacheKey)
      if (cached) {
        console.log("⚡ Redis HIT")
        return NextResponse.json(JSON.parse(cached))
      }
    }
    console.log("❌ Redis MISS")
    console.time("API")

    await ensureStudentEventCollections()

    const eventsCollection = await getEventsCollection()
    const approvalsCollection = await getEventApprovalsCollection()
    const detailsCollection = await getEventDetailsCollection()
    const aiDataCollection = await getEventAiDataCollection()
    const trendingCollection = await getEventTrendingCollection()

    // Build match conditions based on filter
    let matchConditions = {}

    switch (filter) {
      case 'pending':
        matchConditions = {
          dean_status: 'approved',
          registrar_status: 'approved',
          vc_status: 'pending'
        }
        break
      case 'dean-approved':
        matchConditions = { dean_status: 'approved' }
        break
      case 'approved':
      case 'published':
        matchConditions = { vc_status: 'approved' }
        break
      case 'rejected':
        matchConditions = { vc_status: 'rejected' }
        break
      default:
        matchConditions = {
          dean_status: 'approved',
          registrar_status: 'approved'
        }
    }

    const { ObjectId } = require('mongodb')
    
    // 1. Get Approvals matching VC status
    const allApprovals = await approvalsCollection.find(matchConditions).sort({ submitted_at: -1 }).toArray()
    
    // Calculate total count
    const totalCount = allApprovals.length
    
    // Apply pagination
    const paginatedApprovals = allApprovals.slice(offset, offset + limit)
    
    // 2. Safely gather IDs
    const eventIds = paginatedApprovals.map(a => String(a.event_id))
    const objectIds = eventIds.map(id => { try { return new ObjectId(id) } catch { return null } }).filter(Boolean)

    // 3. Find matching events
    const rawEvents = await eventsCollection.find({
      $or: [
        { _id: { $in: eventIds } },
        ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : [])
      ]
    }).toArray()
    
    // Create an events dictionary for O(1) matching
    const eventsMap = {}
    for (const e of rawEvents) {
      eventsMap[String(e._id)] = e
    }

    // Fetch related collections (details, ai, trending) safely
    const eIds = rawEvents.map(e => String(e._id))
    const details = await detailsCollection.find({ event_id: { $in: eIds } }).toArray()
    const aiData = await aiDataCollection.find({ event_id: { $in: eIds } }).toArray()
    const trending = await trendingCollection.find({ event_id: { $in: eIds } }).toArray()

    const detailsMap = {}
    for (const d of details) detailsMap[String(d.event_id)] = d
    
    const aiDataMap = {}
    for (const ai of aiData) aiDataMap[String(ai.event_id)] = ai
    
    const trendingMap = {}
    for (const t of trending) trendingMap[String(t.event_id)] = t

    // 4. Map them together safely
    const events = paginatedApprovals.map(approval => {
      const parentEvent = eventsMap[String(approval.event_id)]
      if (!parentEvent) return null // Drop corrupted mappings
      
      return {
        _id: String(parentEvent._id),
        title: parentEvent.title,
        organizer_name: parentEvent.organizer_name || parentEvent.organizer,
        organizer: parentEvent.organizer,
        department: parentEvent.department,
        venue: parentEvent.venue,
        start_date: parentEvent.start_date,
        end_date: parentEvent.end_date,
        start_time: parentEvent.start_time,
        end_time: parentEvent.end_time,
        max_participants: parentEvent.max_participants,
        status: parentEvent.status,
        poster: parentEvent.poster,
        description: parentEvent.description,
        created_at: parentEvent.created_at,
        organizer_id: parentEvent.organizer_id,
        approval: {
          dean_status: approval.dean_status,
          registrar_status: approval.registrar_status,
          vc_status: approval.vc_status,
          rejection_reason: approval.rejection_reason
        },
        details: detailsMap[String(parentEvent._id)] || null,
        ai_data: aiDataMap[String(parentEvent._id)] || null,
        trending: trendingMap[String(parentEvent._id)] || null
      }
    }).filter(Boolean)

    console.timeEnd("API")

    // Total count is already calculated at the top as 'totalCount'

    const payload = {
      items: events,
      total: totalCount,
      limit,
      offset,
    }

    // Store in Redis
    if (redis && redis.isReady) {
      await redis.setEx(cacheKey, 20, JSON.stringify(payload))
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('VC events error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}