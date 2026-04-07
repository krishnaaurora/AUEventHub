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

    const eventObjectId = (() => { try { return new ObjectId(id) } catch { return null } })()

    // 1. Get Approval matching VC purview
    const approval = await approvalsCollection.findOne({
      $or: [
        { event_id: id },
        ...(eventObjectId ? [{ event_id: eventObjectId }] : [])
      ],
      dean_status: 'approved',
      registrar_status: 'approved'
    })

    if (!approval) {
      return NextResponse.json({ message: 'Event not found or not accessible' }, { status: 404 })
    }

    // 2. Safely get the Event
    const event = await eventsCollection.findOne({
      $or: [
        { _id: id },
        ...(eventObjectId ? [{ _id: eventObjectId }] : [])
      ]
    })

    if (!event) {
      return NextResponse.json({ message: 'Core event missing.' }, { status: 404 })
    }

    // 3. Get auxiliary details
    const eIdMatch = {
      $or: [
        { event_id: id },
        ...(eventObjectId ? [{ event_id: eventObjectId }] : [])
      ]
    }
    
    const [detail, aiData, trending] = await Promise.all([
      detailsCollection.findOne(eIdMatch),
      aiDataCollection.findOne(eIdMatch),
      trendingCollection.findOne(eIdMatch)
    ])

    const payload = {
      _id: String(event._id),
      title: event.title,
      organizer_name: event.organizer_name || event.organizer,
      organizer_id: event.organizer_id,
      department: event.department,
      venue: event.venue,
      start_date: event.start_date,
      end_date: event.end_date,
      start_time: event.start_time,
      end_time: event.end_time,
      max_participants: event.max_participants,
      status: event.status,
      created_at: event.created_at,
      approval: {
        dean_status: approval.dean_status,
        registrar_status: approval.registrar_status,
        vc_status: approval.vc_status,
        dean_approved_at: approval.dean_approved_at,
        registrar_approved_at: approval.registrar_approved_at
      },
      details: detail || null,
      ai_data: aiData || null,
      trending: trending || null
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('VC event details error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}