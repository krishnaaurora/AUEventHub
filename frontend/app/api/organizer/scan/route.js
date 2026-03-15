import { NextResponse } from 'next/server'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { getEventsCollection, ensureStudentEventCollections } from '../../_lib/db'
import { requireOrganizerAccess } from '../_lib/auth'

export async function POST(request) {
  try {
    const auth = await requireOrganizerAccess()
    if (auth.response) return auth.response
    const organizerId = auth.session.user.registrationId || auth.session.user.id

    const body = await request.json()
    const ticketId = String(body.ticket_id || '').trim()

    if (!ticketId) {
      return NextResponse.json({ message: 'Ticket ID is required.' }, { status: 400 })
    }

    await ensureStudentTransactionTables()
    const pool = getPool()

    // Find the registration with this ticket_id
    const regResult = await pool.query('SELECT * FROM registrations WHERE ticket_id = $1', [ticketId])
    if (regResult.rowCount === 0) {
      return NextResponse.json({ message: 'Invalid ticket. Registration not found.' }, { status: 404 })
    }

    const registration = regResult.rows[0]
    const { student_id, event_id, status } = registration

    if (status !== 'confirmed') {
      return NextResponse.json({ message: `Ticket is not confirmed. Status: ${status}` }, { status: 400 })
    }

    // Verify the organizer owns this event
    await ensureStudentEventCollections()
    const eventsCol = await getEventsCollection()
    
    // check if this event belongs to the organizer
    const ObjectId = require('mongodb').ObjectId
    let filter = null
    try { filter = { _id: new ObjectId(event_id) } } catch { filter = { _id: event_id } }
    
    const event = await eventsCol.findOne(filter)
    if (!event) {
      return NextResponse.json({ message: 'Event not found in system.' }, { status: 404 })
    }
    
    // Some events might just store 'organizer_id', some 'createdBy'
    if (String(event.organizer_id || event.createdBy || '') !== String(organizerId)) {
      return NextResponse.json({ message: 'You are not authorized to scan tickets for this event.' }, { status: 403 })
    }

    // Record attendance
    const attendanceResult = await pool.query(
      `INSERT INTO attendance (student_id, event_id, status) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (student_id, event_id) 
       DO UPDATE SET status = EXCLUDED.status, scanned_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [student_id, event_id, 'attended']
    )

    return NextResponse.json({
      message: 'Attendance recorded successfully!',
      attendance: attendanceResult.rows[0],
      registration: {
        student_id,
        event_id,
        ticket_id: ticketId
      }
    })

  } catch (error) {
    console.error('Scan Error:', error)
    return NextResponse.json({ message: 'Failed to record attendance', detail: error.message }, { status: 500 })
  }
}
