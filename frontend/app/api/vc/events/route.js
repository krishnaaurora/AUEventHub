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
        matchConditions = { vc_status: 'approved' }
        break
      case 'rejected':
        matchConditions = { vc_status: 'rejected' }
        break
      case 'published':
        matchConditions = { vc_status: 'approved' }
        break
      default:
        // All events that have reached VC level
        matchConditions = {
          dean_status: 'approved',
          registrar_status: 'approved'
        }
    }

    // Get events with approval data
    const events = await approvalsCollection.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: 'events',
          localField: 'event_id',
          foreignField: '_id',
          as: 'event'
        }
      },
      { $unwind: '$event' },
      {
        $lookup: {
          from: 'event_details',
          localField: 'event_id',
          foreignField: 'event_id',
          as: 'details'
        }
      },
      {
        $lookup: {
          from: 'event_ai_data',
          localField: 'event_id',
          foreignField: 'event_id',
          as: 'ai_data'
        }
      },
      {
        $lookup: {
          from: 'event_trending',
          localField: 'event_id',
          foreignField: 'event_id',
          as: 'trending'
        }
      },
      {
        $project: {
          _id: '$event._id',
          title: '$event.title',
          organizer_name: '$event.organizer_name',
          department: '$event.department',
          venue: '$event.venue',
          start_date: '$event.start_date',
          end_date: '$event.end_date',
          start_time: '$event.start_time',
          end_time: '$event.end_time',
          max_participants: '$event.max_participants',
          status: '$event.status',
          created_at: '$event.created_at',
          approval: {
            dean_status: '$dean_status',
            registrar_status: '$registrar_status',
            vc_status: '$vc_status',
            rejection_reason: '$rejection_reason'
          },
          details: { $arrayElemAt: ['$details', 0] },
          ai_data: { $arrayElemAt: ['$ai_data', 0] },
          trending: { $arrayElemAt: ['$trending', 0] }
        }
      },
      { $sort: { created_at: -1 } },
      { $skip: offset },
      { $limit: limit }
    ]).toArray()

    // Get total count for pagination
    const totalCount = await approvalsCollection.countDocuments(matchConditions)

    return NextResponse.json({
      items: events,
      total: totalCount,
      limit,
      offset,
    })
  } catch (error) {
    console.error('VC events error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}