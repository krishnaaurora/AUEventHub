export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getEventsCollection, getEventApprovalsCollection, ensureStudentEventCollections } from '../../_lib/db'
import { getPool, ensureStudentTransactionTables } from '../../_lib/pg'

export async function POST(request) {
  try {
    await ensureStudentEventCollections()
    await ensureStudentTransactionTables()

    const eventsCol = await getEventsCollection()
    const approvalsCol = await getEventApprovalsCollection()
    const pool = getPool()

    const newEventId = "aucine" + Date.now().toString().slice(-8)
    const today = new Date()
    const tmr = new Date(today)
    tmr.setDate(tmr.getDate() + 1)

    // 1. MonoDB: Add AI Cinema Event
    const eventDoc = {
      _id: newEventId,
      title: "Au Cinema: Screening of Interstellar",
      category: "Cultural",
      department: "Media",
      venue: "Main Auditorium",
      start_date: today.toISOString().slice(0, 10),
      end_date: tmr.toISOString().slice(0, 10),
      start_time: "18:00",
      end_time: "21:00",
      organizer_id: "org1",
      organizer: "Film Club",
      status: "approved",
      registered_count: 0,
      created_at: today.toISOString()
    }
    await eventsCol.insertOne(eventDoc)

    await approvalsCol.insertOne({
      event_id: newEventId,
      dean_status: 'approved',
      registrar_status: 'approved',
      vc_status: 'approved'
    })

    // 2. PostgreSQL: Add Registration
    const studentId = "E2E-TEST-STUDENT"
    const ticketId = "TKT-AUCINEMA-" + Math.floor(Math.random() * 10000000)

    const regRes = await pool.query(
      'INSERT INTO registrations (student_id, event_id, ticket_id) VALUES ($1, $2, $3) RETURNING *',
      [studentId, newEventId, ticketId]
    )

    await eventsCol.updateOne({ _id: newEventId }, { $inc: { registered_count: 1 } })

    // 3. PostgreSQL: Add Attendance Verification
    const attRes = await pool.query(
      'INSERT INTO attendance (student_id, event_id, status) VALUES ($1, $2, $3) RETURNING *',
      [studentId, newEventId, 'attended']
    )

    return NextResponse.json({
      success: true,
      message: 'Au Cinema event created and fully flow-tested with registrations',
      event: eventDoc,
      postgres_registration: regRes.rows[0],
      postgres_attendance: attRes.rows[0]
    })

  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 })
  }
}
