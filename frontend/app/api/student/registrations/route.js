import { NextResponse } from 'next/server'
import { getEventsCollection } from '../../_lib/db'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { emitSocketEvent } from '../../../../server/socket'

function buildTicketId(studentId, eventId) {
  const studentPart = String(studentId).replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase() || 'STUDENT'
  const eventPart = String(eventId).replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase() || 'EVENT'
  const uniquePart = Date.now().toString().slice(-6)
  return `TKT-${studentPart}-${eventPart}-${uniquePart}`
}

function buildQrPayload(ticketId, studentId, eventId) {
  return JSON.stringify({ ticketId, studentId, eventId, t: Date.now() })
}

export async function GET(request) {
  try {
    await ensureStudentTransactionTables()
    const pool = getPool()
    const { searchParams } = new URL(request.url)
    const studentId = String(searchParams.get('student_id') || '').trim()
    const ticketId = String(searchParams.get('ticket_id') || '').trim()

    let result
    if (ticketId) {
      result = await pool.query(
        `SELECT id, student_id, event_id, ticket_id, registered_at
         FROM registrations
         WHERE ticket_id = $1
         ORDER BY registered_at DESC`,
        [ticketId],
      )
    } else if (studentId) {
      result = await pool.query(
        `SELECT id, student_id, event_id, ticket_id, registered_at
         FROM registrations
         WHERE student_id = $1
         ORDER BY registered_at DESC`,
        [studentId],
      )
    } else {
      result = await pool.query(
        `SELECT id, student_id, event_id, ticket_id, registered_at
         FROM registrations
         ORDER BY registered_at DESC`,
      )
    }

    const registrations = result.rows
    const eventIds = [...new Set(registrations.map((item) => item.event_id).filter(Boolean))]
    const eventsCollection = await getEventsCollection()
    const eventDocs = eventIds.length > 0
      ? await eventsCollection.find({ _id: { $in: eventIds } }).toArray()
      : []

    const eventsById = Object.fromEntries(
      eventDocs.map((event) => [String(event._id), { ...event, _id: String(event._id) }]),
    )

    const items = registrations.map((item) => {
      const event = eventsById[item.event_id]
      return {
        id: item.id,
        student_id: item.student_id,
        event_id: item.event_id,
        ticket_id: item.ticket_id,
        qr_code: item.qr_code || null,
        registered_at: item.registered_at || item.registration_date,
        registration_date: item.registration_date || item.registered_at,
        event_title: event?.title || item.event_id,
        venue: event?.venue || 'Venue TBA',
        organizer: event?.organizer || 'Organizer TBA',
        date: event?.start_date || event?.date || null,
        time: event?.start_time || event?.time || null,
        status: item.status || 'Confirmed',
      }
    })

    return NextResponse.json({ items })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch registrations.', detail: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    await ensureStudentTransactionTables()
    const pool = getPool()
    const body = await request.json()


    const studentId = String(body.student_id || '').trim()
    let eventId = String(body.event_id || '').trim()

    // Convert eventId to ObjectId if possible
    let eventObjectId = eventId
    try {
      const { ObjectId } = (await import('mongodb'))
      if (ObjectId.isValid(eventId)) {
        eventObjectId = new ObjectId(eventId)
      }
    } catch (e) {
      // fallback: use as string
    }

    if (!studentId || !eventId) {
      return NextResponse.json(
        { message: 'student_id and event_id are required.' },
        { status: 400 },
      )
    }

    const eventsCollection = await getEventsCollection()
    const event = await eventsCollection.findOne({ _id: eventObjectId })
    if (!event) {
      return NextResponse.json({ message: 'Event not found.' }, { status: 404 })
    }

    const existing = await pool.query(
      'SELECT id, ticket_id FROM registrations WHERE student_id = $1 AND event_id = $2',
      [studentId, eventId],
    )
    if (existing.rowCount > 0) {
      return NextResponse.json(
        {
          message: 'Student is already registered for this event.',
          registration: existing.rows[0],
        },
        { status: 409 },
      )
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const ticketId = buildTicketId(studentId, eventId)
      const qrPayload = buildQrPayload(ticketId, studentId, eventId)
      const now = new Date().toISOString()
      const registrationResult = await client.query(
        `INSERT INTO registrations (student_id, event_id, ticket_id, qr_code, registration_date, registered_at, status)
         VALUES ($1, $2, $3, $4, $5, $5, $6)
         RETURNING id, student_id, event_id, ticket_id, qr_code, registered_at, registration_date, status`,
        [studentId, eventId, ticketId, qrPayload, now, 'confirmed'],
      )

      const notificationResult = await client.query(
        `INSERT INTO notifications (user_id, type, title, message, priority, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, user_id, message, priority, created_at`,
        [studentId, 'info', 'Registration Confirmed', `Registration confirmed for ${event.title}. Ticket ${ticketId} is ready.`, 'medium', false, now],
      )

      await client.query('COMMIT')

      const registration = registrationResult.rows[0]
      const notification = notificationResult.rows[0]

      emitSocketEvent('registration:changed', {
        type: 'created',
        student_id: studentId,
        event_id: eventId,
        event_title: event.title,
        venue: event.venue || 'Venue TBA',
        organizer: event.organizer || 'Organizer TBA',
        date: event.date || null,
        time: event.time || null,
        registration,
      })
      emitSocketEvent('registration:changed', {
        type: 'created',
        student_id: studentId,
        event_id: eventId,
        event_title: event.title,
        venue: event.venue || 'Venue TBA',
        organizer: event.organizer || 'Organizer TBA',
        date: event.date || null,
        time: event.time || null,
        registration,
      }, `user:${studentId}`)
      emitSocketEvent('registration:changed', {
        type: 'created',
        student_id: studentId,
        event_id: eventId,
        event_title: event.title,
        venue: event.venue || 'Venue TBA',
        organizer: event.organizer || 'Organizer TBA',
        date: event.date || null,
        time: event.time || null,
        registration,
      }, `event:${eventId}`)
      emitSocketEvent('notification:new', notification, `user:${studentId}`)
      emitSocketEvent('dashboard:refresh', { scope: 'student', studentId }, `user:${studentId}`)
      emitSocketEvent('dashboard:refresh', { scope: 'organizer', eventId }, 'role:organizer')

      return NextResponse.json(
        {
          message: 'Registration successful.',
          registration,
        },
        { status: 201 },
      )
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    if (error?.code === '23505') {
      return NextResponse.json(
        { message: 'Student is already registered for this event.' },
        { status: 409 },
      )
    }

    return NextResponse.json(
      { message: 'Failed to create registration.', detail: error.message },
      { status: 500 },
    )
  }
}
