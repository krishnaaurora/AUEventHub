export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import {
  ensureStudentEventCollections,
  getEventsCollection,
  getEventApprovalsCollection,
  getEventAiDataCollection,
} from '../../_lib/db'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { emitSocketEvent } from '../../../../server/socket'
import { requireRegistrarAccess } from '../_lib/auth'

export async function POST(request) {
  try {
    const auth = await requireRegistrarAccess()
    if (auth.response) return auth.response

    await ensureStudentEventCollections()
    const eventsCol = await getEventsCollection()
    const approvalsCol = await getEventApprovalsCollection()
    const aiDataCol = await getEventAiDataCollection()

    const body = await request.json()
    const eventId = String(body.event_id || '').trim()
    const action = String(body.action || '').trim().toLowerCase()
    const reason = String(body.reason || '').trim()
    const comment = String(body.comment || '').trim()

    if (!eventId || !action) {
      console.log('[REGISTRAR ACTION] 400: Missing eventId or action', { eventId, action })
      return NextResponse.json(
        { message: 'event_id and action are required.' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      console.log('[REGISTRAR ACTION] 400: Invalid action', { action })
      return NextResponse.json(
        { message: 'Action must be approve or reject.' },
        { status: 400 }
      )
    }

    const filter = {
      $or: [
        { _id: eventId },
        ...(eventId.length === 24 ? [{ _id: (() => { try { return new ObjectId(eventId) } catch { return eventId } })() }] : [])
      ],
    }

    const event = await eventsCol.findOne(filter)
    if (!event) {
      return NextResponse.json({ message: 'Event not found.' }, { status: 404 })
    }

    const currentStatus = event.status
    if (currentStatus !== 'pending_registrar') {
      console.log('[REGISTRAR ACTION] 400: Status mismatch', { eventId, currentStatus, expected: 'pending_registrar' })
      return NextResponse.json(
        { message: `Event is not pending registrar approval. Current status: ${currentStatus || 'none'}` },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      await eventsCol.updateOne(filter, {
        $set: { status: 'pending_vc', updatedAt: new Date() },
      })

      await approvalsCol.updateOne(
        { event_id: String(event._id) },
        {
          $set: {
            registrar_status: 'approved',
            vc_status: 'pending',
            registrar_comment: comment || '',
            registrar_reviewed_at: new Date().toISOString(),
            updatedAt: new Date(),
          },
          $setOnInsert: {
            event_id: String(event._id),
            submitted_at: new Date().toISOString().slice(0, 10),
            createdAt: new Date(),
          },
        },
        { upsert: true }
      )

      await aiDataCol.updateOne(
        { event_id: String(event._id) },
        {
          $set: { approval_stage: 'pending_vc', updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      )

      // Notify organizer
      try {
        await ensureStudentTransactionTables()
        const pool = getPool()
        const organizerId = event.organizer_id || ''
        if (organizerId) {
          await pool.query(
            'INSERT INTO notifications (user_id, message, priority) VALUES ($1, $2, $3)',
            [organizerId, `Your event "${event.title}" has been approved by the Registrar and is now pending VC final approval.`, 'high']
          )
        }
      } catch {
        // notification failure is non-critical
      }

      emitSocketEvent('dashboard:refresh', { scope: 'registrar' }, 'role:registrar')
      emitSocketEvent('dashboard:refresh', { scope: 'vc' }, 'role:vc')
      emitSocketEvent('dashboard:refresh', { scope: 'organizer' }, 'role:organizer')

      return NextResponse.json({
        message: 'Event approved by Registrar. Forwarded to VC.',
        status: 'pending_vc',
      })
    }

    if (action === 'reject') {
      await eventsCol.updateOne(filter, {
        $set: { status: 'rejected', updatedAt: new Date() },
      })

      await approvalsCol.updateOne(
        { event_id: String(event._id) },
        {
          $set: {
            registrar_status: 'rejected',
            registrar_rejection_reason: reason || 'No reason provided',
            registrar_comment: comment || reason || '',
            registrar_reviewed_at: new Date().toISOString(),
            updatedAt: new Date(),
          },
          $setOnInsert: {
            event_id: String(event._id),
            submitted_at: new Date().toISOString().slice(0, 10),
            createdAt: new Date(),
          },
        },
        { upsert: true }
      )

      await aiDataCol.updateOne(
        { event_id: String(event._id) },
        {
          $set: { approval_stage: 'rejected', updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      )

      // Notify organizer
      try {
        await ensureStudentTransactionTables()
        const pool = getPool()
        const organizerId = event.organizer_id || ''
        if (organizerId) {
          await pool.query(
            'INSERT INTO notifications (user_id, message, priority) VALUES ($1, $2, $3)',
            [organizerId, `Your event "${event.title}" has been rejected by the Registrar. Reason: ${reason || 'No reason provided'}`, 'high']
          )
        }
      } catch {
        // notification failure is non-critical
      }

      emitSocketEvent('dashboard:refresh', { scope: 'registrar' }, 'role:registrar')
      emitSocketEvent('dashboard:refresh', { scope: 'organizer' }, 'role:organizer')

      return NextResponse.json({
        message: 'Event rejected by Registrar.',
        status: 'rejected',
      })
    }
  } catch (error) {
    console.error('[REGISTRAR ACTION ERROR]', error)
    return NextResponse.json(
      { message: 'Failed to process registrar action.', detail: error.message },
      { status: 500 }
    )
  }
}