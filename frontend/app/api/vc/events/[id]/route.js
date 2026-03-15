import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import {
  ensureStudentEventCollections,
  getEventsCollection,
  getEventApprovalsCollection,
  getEventDetailsCollection,
  getEventAiDataCollection,
  getEventTrendingCollection,
} from '../../../_lib/db'
import { requireVCAccess } from '../../_lib/auth'

export async function GET(request, { params }) {
  try {
    const auth = await requireVCAccess()
    if (auth.response) return auth.response

    const { id } = params

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid event ID' }, { status: 400 })
    }

    await ensureStudentEventCollections()

    const eventsCollection = await getEventsCollection()
    const approvalsCollection = await getEventApprovalsCollection()
    const detailsCollection = await getEventDetailsCollection()
    const aiDataCollection = await getEventAiDataCollection()
    const trendingCollection = await getEventTrendingCollection()

    const eventObjectId = new ObjectId(id)

    // Get event with all related data
    const event = await approvalsCollection.aggregate([
      {
        $match: {
          event_id: eventObjectId,
          dean_status: 'approved',
          registrar_status: 'approved',
          vc_status: 'pending'
        }
      },
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
          organizer_id: '$event.organizer_id',
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
            dean_approved_at: '$dean_approved_at',
            registrar_approved_at: '$registrar_approved_at'
          },
          details: { $arrayElemAt: ['$details', 0] },
          ai_data: { $arrayElemAt: ['$ai_data', 0] },
          trending: { $arrayElemAt: ['$trending', 0] }
        }
      }
    ]).toArray()

    if (event.length === 0) {
      return NextResponse.json({ message: 'Event not found or not accessible' }, { status: 404 })
    }

    return NextResponse.json(event[0])
  } catch (error) {
    console.error('VC event details error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}