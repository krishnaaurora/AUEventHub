import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import {
  ensureStudentEventCollections,
  getEventsCollection,
  getEventApprovalsCollection,
  getNotificationsCollection,
} from '../../_lib/db'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { emitSocketEvent } from '../../../../server/socket'
import { requireVCAccess } from '../_lib/auth'

export async function POST(request) {
  try {
    const auth = await requireVCAccess()
    if (auth.response) return auth.response

    const { eventId, action, rejectionReason, comment } = await request.json()

    if (!eventId || !action) {
      return NextResponse.json({ message: 'Event ID and action are required' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action. Must be approve or reject' }, { status: 400 })
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json({ message: 'Rejection reason is required' }, { status: 400 })
    }

    await ensureStudentEventCollections()
    await ensureStudentTransactionTables()

    const eventsCollection = await getEventsCollection()
    const approvalsCollection = await getEventApprovalsCollection()
    const notificationsCollection = await getNotificationsCollection()
    const pool = getPool()

    const eventObjectId = (() => { try { return new ObjectId(eventId) } catch { return null } })()
    const eventFilter = {
      $or: [
        { _id: eventId },
        ...(eventObjectId ? [{ _id: eventObjectId }] : []),
      ]
    }

    // More permissive filter - find the approval record for this event
    const approvalFilter = {
      $or: [
        { event_id: eventId },
        ...(eventObjectId ? [{ event_id: eventObjectId }] : []),
      ],
      dean_status: 'approved',
      registrar_status: 'approved',
    }

    // Check if event exists and is in correct state
    const approval = await approvalsCollection.findOne(approvalFilter)

    if (!approval) {
      return NextResponse.json({ message: 'Event not found or not eligible for VC approval' }, { status: 404 })
    }

    const updateData = {
      vc_status: action === 'approve' ? 'approved' : 'rejected',
      vc_approved_at: new Date(),
      vc_approved_by: auth.session.user.id,
      vc_comment: comment || rejectionReason || '',
    }

    if (action === 'reject') {
      updateData.rejection_reason = rejectionReason
    }

    // Update approval status
    await approvalsCollection.updateOne(approvalFilter, { $set: updateData })

    // If approved, move event into the published lifecycle stage.
    if (action === 'approve') {
      await eventsCollection.updateOne(
        eventFilter,
        { $set: { status: 'published', published_at: new Date().toISOString(), updatedAt: new Date() } }
      )
    } else {
      await eventsCollection.updateOne(eventFilter, { $set: { status: 'rejected', updatedAt: new Date() } })
    }

    // Create notification for organizer
    const event = await eventsCollection.findOne(eventFilter)
    const notificationMessage = event
      ? action === 'approve'
        ? `Your event "${event.title}" has been approved by the Vice Chancellor and is now live!`
        : `Your event "${event.title}" has been rejected by the Vice Chancellor. Reason: ${rejectionReason}`
      : null

    if (event && notificationMessage) {
      try {
        await pool.query(`
          INSERT INTO notifications (user_id, type, title, message, event_id, priority)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          String(event.organizer_id || ''),
          action === 'approve' ? 'event_approved' : 'event_rejected',
          action === 'approve' ? 'Event Approved!' : 'Event Rejected',
          notificationMessage,
          String(eventId),
          'high'
        ])
      } catch (pgError) {
        console.error('[VC ACTION] PG Notification Error:', pgError.message)
      }

      try {
        await notificationsCollection.insertOne({
          user_id: String(event.organizer_id || 'all'),
          role: 'organizer',
          title: action === 'approve' ? 'Event Published' : 'Event Rejected',
          message: notificationMessage,
          type: action === 'approve' ? 'event_published' : 'event_rejected',
          event_id: String(event._id),
          is_read: false,
          created_at: new Date().toISOString(),
        })
      } catch (mongoError) {
        console.error('[VC ACTION] Mongo Notification Error:', mongoError.message)
      }
    }

    // Emit socket events for real-time updates
    emitSocketEvent('dashboard:refresh', { scope: 'vc' }, 'role:vc')
    emitSocketEvent('dashboard:refresh', { scope: 'organizer' }, 'role:organizer')
    emitSocketEvent('dashboard:refresh', { scope: 'student' }, 'role:student')
    emitSocketEvent('dashboard:refresh', { scope: 'registrar' }, 'role:registrar')
    emitSocketEvent('event:status:changed', { eventId, action }, 'role:all')

    // Notify organizer via socket
    if (event?.organizer_id && notificationMessage) {
      emitSocketEvent('notification:new', {
        id: `vc_${action}_${eventId}`,
        type: action === 'approve' ? 'event_approved' : 'event_rejected',
        title: action === 'approve' ? 'Event Approved!' : 'Event Rejected',
        message: notificationMessage,
        event_id: eventId,
        created_at: new Date().toISOString()
      }, `user:${event.organizer_id}`)
    }

    return NextResponse.json({
      message: `Event ${action}d successfully`,
      action,
      eventId
    })
  } catch (error) {
    console.error('[VC ACTION] 500 Error:', error)
    return NextResponse.json({ 
      message: 'Internal server error', 
      detail: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}