export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getEventsCollection, getDb } from '../../_lib/db'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { emitSocketEvent } from '../../../../server/socket'
import { ObjectId } from 'mongodb'

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
        `SELECT id, student_id, event_id, ticket_id, qr_code, registered_at, registration_date, status
         FROM registrations
         WHERE ticket_id = $1
         ORDER BY registered_at DESC`,
        [ticketId],
      )
    } else if (studentId) {
      result = await pool.query(
        `SELECT id, student_id, event_id, ticket_id, qr_code, registered_at, registration_date, status
         FROM registrations
         WHERE student_id = $1
         ORDER BY registered_at DESC`,
        [studentId],
      )
    } else {
      result = await pool.query(
        `SELECT id, student_id, event_id, ticket_id, qr_code, registered_at, registration_date, status
         FROM registrations
         ORDER BY registered_at DESC`,
      )
    }

    const registrations = result.rows
    const eventIds = [...new Set(registrations.map((item) => item.event_id).filter(Boolean))]
    const eventsCollection = await getEventsCollection()

    let eventDocs = []
    if (eventIds.length > 0) {
      // Try to convert IDs to ObjectIds for MongoDB lookup
      const objectIds = []
      const stringIds = []
      for (const id of eventIds) {
        if (ObjectId.isValid(id) && id.length === 24) {
          objectIds.push(new ObjectId(id))
          stringIds.push(id) // also try as string
        } else {
          stringIds.push(id)
        }
      }

      // Query with $or to match both ObjectId and string _id
      const query = objectIds.length > 0
        ? { $or: [{ _id: { $in: objectIds } }, { _id: { $in: stringIds } }] }
        : { _id: { $in: stringIds } }

      eventDocs = await eventsCollection.find(query).toArray()
    }

    // Build lookup by both string and original _id
    const eventsById = {}
    for (const event of eventDocs) {
      const key = String(event._id)
      eventsById[key] = { ...event, _id: key }
    }

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
        event_title: event?.title || null,
        venue: event?.venue || null,
        organizer: event?.organizer || event?.organizer_name || null,
        date: event?.start_date || event?.date || null,
        time: event?.start_time || event?.time || null,
        poster: event?.poster || null,
        category: event?.category || null,
        status: item.status || 'confirmed',
      }
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('[REGISTRATION GET] Error:', error)
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

    // Try ObjectId first, then fall back to string _id
    let event = await eventsCollection.findOne({ _id: eventObjectId })
    if (!event) {
      event = await eventsCollection.findOne({ _id: eventId })
    }

    if (!event) {
      console.error('[REGISTRATION] Event not found:', eventId)
      return NextResponse.json({ message: 'Event not found.' }, { status: 404 })
    }

    // Use the canonical string ID from the found event
    const canonicalEventId = String(event._id)

    const existing = await pool.query(
      'SELECT id, ticket_id FROM registrations WHERE student_id = $1 AND event_id = $2',
      [studentId, canonicalEventId],
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
      const ticketId = buildTicketId(studentId, canonicalEventId)
      const qrPayload = buildQrPayload(ticketId, studentId, canonicalEventId)
      const now = new Date().toISOString()
      const registrationResult = await client.query(
        `INSERT INTO registrations (student_id, event_id, ticket_id, qr_code, registration_date, registered_at, status)
         VALUES ($1, $2, $3, $4, $5, $5, $6)
         RETURNING id, student_id, event_id, ticket_id, qr_code, registered_at, registration_date, status`,
        [studentId, canonicalEventId, ticketId, qrPayload, now, 'confirmed'],
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

      // ✅ Update MongoDB Mirror (non-critical)
      try {
        const db = await getDb()
        // 1. Update event count
        await db.collection('events').updateOne(
          { _id: event._id },
          { $inc: { registered_count: 1 }, $set: { updatedAt: new Date() } }
        )

        // 2. Create registration record in MongoDB for visibility
        await db.collection('registrations').updateOne(
          { ticket_id: registration.ticket_id },
          {
            $set: {
              ticket_id: registration.ticket_id,
              student_id: studentId,
              event_id: canonicalEventId,
              qr_code: registration.qr_code,
              status: registration.status,
              event_title: event.title,
              venue: event.venue || '',
              organizer: event.organizer || event.organizer_name || '',
              poster: event.poster || '',
              category: event.category || '',
              start_date: event.start_date || event.date || '',
              start_time: event.start_time || event.time || '',
              registered_at: now,
              created_at: now,
              updated_at: now
            }
          },
          { upsert: true }
        )
      } catch (mongoErr) {
        console.error('[REGISTRATION] MongoDB update failed (non-critical):', mongoErr.message)
      }

      // Consolidate payload
      const payload = { 
        ...registration, 
        event_title: event.title, 
        event_poster: event.poster, 
        event_category: event.category,
        venue: event.venue,
        organizer: event.organizer || event.organizer_name
      }

      // Emit real-time events
      emitSocketEvent('registration:changed', payload)
      emitSocketEvent('registration:new', payload, `user:${studentId}`)
      emitSocketEvent('notification:new', notification, `user:${studentId}`)

      // Refresh student & organizer dashboards
      emitSocketEvent('dashboard:refresh', { scope: 'student' }, 'role:student')
      emitSocketEvent('dashboard:refresh', { scope: 'organizer' }, 'role:organizer')

      return NextResponse.json({ registration: payload, notification }, { status: 201 })
    } catch (err) {
      await client.query('ROLLBACK')
      console.error('[REGISTRATION] Transaction Failed:', err.message)
      return NextResponse.json(
        { message: 'Registration failed during database write.', detail: err.message },
        { status: 500 },
      )
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('[REGISTRATION] Internal server error:', error)
    return NextResponse.json(
      { message: 'Internal server error.', detail: error.message },
      { status: 500 },
    )
  }
}
