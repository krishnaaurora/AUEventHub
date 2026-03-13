import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import {
  ensureStudentEventCollections,
  getEventAiDataCollection,
  getEventApprovalsCollection,
  getEventsCollection,
} from '../../_lib/db'
import { emitSocketEvent } from '../../../../server/socket'

export async function POST(request) {
  try {
    await ensureStudentEventCollections()
    const eventsCollection = await getEventsCollection()
    const approvalsCollection = await getEventApprovalsCollection()
    const aiDataCollection = await getEventAiDataCollection()

    const body = await request.json()
    const eventId = String(body.event_id || '').trim()
    const action = String(body.action || '').trim().toLowerCase()

    if (!eventId || !action) {
      return NextResponse.json(
        { message: 'event_id and action are required.' },
        { status: 400 }
      )
    }

    const validActions = ['cancel', 'approve', 'reject']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { message: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    let filter
    try {
      filter = { _id: new ObjectId(eventId) }
    } catch {
      filter = { _id: eventId }
    }

    const event = await eventsCollection.findOne(filter)
    if (!event) {
      return NextResponse.json({ message: 'Event not found.' }, { status: 404 })
    }

    let newStatus
    if (action === 'cancel') {
      newStatus = 'cancelled'
    } else if (action === 'approve') {
      // Approval workflow: pending_dean → pending_registrar → pending_vc → approved
      const approvalFlow = {
        pending_dean: 'pending_registrar',
        pending_registrar: 'pending_vc',
        pending_vc: 'approved',
      }
      newStatus = approvalFlow[event.status] || 'approved'
    } else if (action === 'reject') {
      newStatus = 'rejected'
    }

    await eventsCollection.updateOne(filter, {
      $set: { status: newStatus, updatedAt: new Date() },
    })

    const approvalUpdate = {
      updatedAt: new Date(),
    }

    if (action === 'cancel') {
      approvalUpdate.dean_status = 'cancelled'
      approvalUpdate.registrar_status = 'cancelled'
      approvalUpdate.vc_status = 'cancelled'
    } else if (action === 'reject') {
      if (event.status === 'pending_dean' || event.status === 'pending') {
        approvalUpdate.dean_status = 'rejected'
      }
      if (event.status === 'pending_registrar') {
        approvalUpdate.dean_status = 'approved'
        approvalUpdate.registrar_status = 'rejected'
      }
      if (event.status === 'pending_vc') {
        approvalUpdate.dean_status = 'approved'
        approvalUpdate.registrar_status = 'approved'
        approvalUpdate.vc_status = 'rejected'
      }
    } else if (action === 'approve') {
      if (event.status === 'pending_dean' || event.status === 'pending') {
        approvalUpdate.dean_status = 'approved'
        approvalUpdate.registrar_status = 'pending'
        approvalUpdate.vc_status = 'pending'
      }
      if (event.status === 'pending_registrar') {
        approvalUpdate.dean_status = 'approved'
        approvalUpdate.registrar_status = 'approved'
        approvalUpdate.vc_status = 'pending'
      }
      if (event.status === 'pending_vc') {
        approvalUpdate.dean_status = 'approved'
        approvalUpdate.registrar_status = 'approved'
        approvalUpdate.vc_status = 'approved'
      }
    }

    await approvalsCollection.updateOne(
      { event_id: String(event._id) },
      {
        $set: approvalUpdate,
        $setOnInsert: {
          event_id: String(event._id),
          dean_status: 'pending',
          registrar_status: 'pending',
          vc_status: 'pending',
          submitted_at: new Date().toISOString().slice(0, 10),
          createdAt: new Date(),
        },
      },
      { upsert: true },
    )

    await aiDataCollection.updateOne(
      { event_id: String(event._id) },
      {
        $set: { approval_stage: newStatus, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    )

    emitSocketEvent('dashboard:refresh', { scope: 'organizer' }, 'role:organizer')
    emitSocketEvent('dashboard:refresh', { scope: 'student' })

    if (newStatus === 'approved') {
      emitSocketEvent('event:new', { ...event, _id: String(event._id), status: newStatus })
    }

    return NextResponse.json({
      message: `Event ${action === 'cancel' ? 'cancelled' : action + 'd'} successfully.`,
      status: newStatus,
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to perform action.', detail: error.message },
      { status: 500 }
    )
  }
}
