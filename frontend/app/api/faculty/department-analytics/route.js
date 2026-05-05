export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ensureStudentEventCollections, getEventsCollection } from '../../_lib/db'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { requireFacultyAccess } from '../_lib/auth'

export async function GET() {
  try {
    const auth = await requireFacultyAccess()
    if (auth.response) return auth.response

    await ensureStudentEventCollections()
    await ensureStudentTransactionTables()

    const eventsCollection = await getEventsCollection()
    const pool = getPool()

    const events = await eventsCollection
      .find({ status: { $in: ['approved', 'published', 'completed'] } })
      .toArray()
    const eventIds = events.map((event) => String(event._id))

    let registrationRows = []
    let attendanceRows = []

    if (eventIds.length > 0) {
      registrationRows = (
        await pool.query(
          `SELECT event_id, COUNT(*)::int AS count
           FROM registrations
           WHERE event_id = ANY($1)
           GROUP BY event_id`,
          [eventIds],
        )
      ).rows

      attendanceRows = (
        await pool.query(
          `SELECT event_id, COUNT(*)::int AS count
           FROM attendance
           WHERE event_id = ANY($1) AND LOWER(status) = 'present'
           GROUP BY event_id`,
          [eventIds],
        )
      ).rows
    }

    const regByEvent = new Map(registrationRows.map((row) => [String(row.event_id), Number(row.count || 0)]))
    const attByEvent = new Map(attendanceRows.map((row) => [String(row.event_id), Number(row.count || 0)]))

    const byDepartment = new Map()
    for (const event of events) {
      const dept = event.department || 'N/A'
      const id = String(event._id)
      const current = byDepartment.get(dept) || {
        events: 0,
        participants: 0,
        attendance: 0,
      }

      byDepartment.set(dept, {
        events: current.events + 1,
        participants: current.participants + (regByEvent.get(id) || 0),
        attendance: current.attendance + (attByEvent.get(id) || 0),
      })
    }

    const items = Array.from(byDepartment.entries())
      .map(([department, values]) => ({
        department,
        events: values.events,
        participants: values.participants,
        attendance: values.attendance,
      }))
      .sort((a, b) => b.participants - a.participants)

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Faculty department analytics error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
