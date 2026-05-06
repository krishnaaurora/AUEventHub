export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getEventsCollection } from '../../../_lib/db'
import { ensureStudentTransactionTables, getPool } from '../../../_lib/pg'
import { emitSocketEvent } from '../../../../../server/socket'

export async function GET(_request, { params }) {
  try {
    await ensureStudentTransactionTables()
    const registrationId = Number(params.id)
    if (!Number.isInteger(registrationId)) {
      return NextResponse.json({ message: 'Invalid registration id.' }, { status: 400 })
    }

    const pool = getPool()
    const result = await pool.query(
      `SELECT id, student_id, event_id, ticket_id, registered_at
       FROM registrations
       WHERE id = $1`,
      [registrationId],
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ message: 'Registration not found.' }, { status: 404 })
    }

    const registration = result.rows[0]
    const eventsCollection = await getEventsCollection()
    const event = await eventsCollection.findOne({ _id: registration.event_id })

    return NextResponse.json({
      id: registration.id,
      student_id: registration.student_id,
      event_id: registration.event_id,
      ticket_id: registration.ticket_id,
      registered_at: registration.registered_at,
      event_title: event?.title || registration.event_id,
      venue: event?.venue || 'Venue TBA',
      organizer: event?.organizer || 'Organizer TBA',
      date: event?.date || null,
      time: event?.time || null,
      status: 'Confirmed',
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch registration.', detail: error.message },
      { status: 500 },
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    await ensureStudentTransactionTables()
    const registrationId = Number(params.id)
    if (!Number.isInteger(registrationId)) {
      return NextResponse.json({ message: 'Invalid registration id.' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = String(searchParams.get('student_id') || '').trim()
    const pool = getPool()
    const client = await pool.connect()
    const eventsCollection = await getEventsCollection()

    try {
      await client.query('BEGIN')
      const existing = studentId
        ? await client.query(
            `SELECT id, student_id, event_id FROM registrations WHERE id = $1 AND student_id = $2`,
            [registrationId, studentId],
          )
        : await client.query(
            `SELECT id, student_id, event_id FROM registrations WHERE id = $1`,
            [registrationId],
          )

      if (existing.rowCount === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json({ message: 'Registration not found.' }, { status: 404 })
      }

      const registration = existing.rows[0]
  const event = await eventsCollection.findOne({ _id: registration.event_id })
      await client.query('DELETE FROM registrations WHERE id = $1', [registrationId])
      const notificationResult = await client.query(
        `INSERT INTO notifications (user_id, message, priority)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, message, priority, created_at`,
        [registration.student_id, `Registration cancelled for event ${registration.event_id}.`, 'high'],
      )
      await client.query('COMMIT')

      emitSocketEvent('registration:changed', {
        type: 'deleted',
        student_id: registration.student_id,
        event_id: registration.event_id,
        event_title: event?.title || registration.event_id,
        venue: event?.venue || 'Venue TBA',
        organizer: event?.organizer || 'Organizer TBA',
        date: event?.date || null,
        time: event?.time || null,
        registration_id: registrationId,
      })
      emitSocketEvent('registration:changed', {
        type: 'deleted',
        student_id: registration.student_id,
        event_id: registration.event_id,
        event_title: event?.title || registration.event_id,
        venue: event?.venue || 'Venue TBA',
        organizer: event?.organizer || 'Organizer TBA',
        date: event?.date || null,
        time: event?.time || null,
        registration_id: registrationId,
      }, `user:${registration.student_id}`)
      emitSocketEvent('registration:changed', {
        type: 'deleted',
        student_id: registration.student_id,
        event_id: registration.event_id,
        event_title: event?.title || registration.event_id,
        venue: event?.venue || 'Venue TBA',
        organizer: event?.organizer || 'Organizer TBA',
        date: event?.date || null,
        time: event?.time || null,
        registration_id: registrationId,
      }, `event:${registration.event_id}`)
      emitSocketEvent('notification:new', notificationResult.rows[0], `user:${registration.student_id}`)
      emitSocketEvent('dashboard:refresh', { scope: 'student', studentId: registration.student_id }, `user:${registration.student_id}`)
      emitSocketEvent('dashboard:refresh', { scope: 'organizer', eventId: registration.event_id }, 'role:organizer')

      return NextResponse.json({ message: 'Registration cancelled successfully.' })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to cancel registration.', detail: error.message },
      { status: 500 },
    )
  }
}
