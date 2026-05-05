export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import {
  ensureStudentEventCollections,
  getEventsCollection,
  getUsersCollection,
} from '../../_lib/db'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { requireFacultyAccess } from '../_lib/auth'

export async function GET() {
  try {
    const auth = await requireFacultyAccess()
    if (auth.response) return auth.response

    await ensureStudentEventCollections()
    await ensureStudentTransactionTables()

    const pool = getPool()
    const usersCollection = await getUsersCollection()
    const eventsCollection = await getEventsCollection()

    const attendanceRows = await pool.query(
      `SELECT student_id, event_id, status, scanned_at
       FROM attendance
       ORDER BY scanned_at DESC
       LIMIT 200`,
    )

    const studentIds = Array.from(new Set(attendanceRows.rows.map((row) => String(row.student_id))))
    const eventIds = Array.from(new Set(attendanceRows.rows.map((row) => String(row.event_id))))

    const [students, events] = await Promise.all([
      usersCollection
        .find({
          $or: [
            { _id: { $in: studentIds } },
            { registrationId: { $in: studentIds } },
            { student_id: { $in: studentIds } },
          ],
        })
        .toArray(),
      eventsCollection
        .find({ _id: { $in: eventIds } })
        .toArray(),
    ])

    const studentMap = new Map()
    for (const student of students) {
      studentMap.set(String(student._id), student)
      if (student.registrationId) {
        studentMap.set(String(student.registrationId), student)
      }
      if (student.student_id) {
        studentMap.set(String(student.student_id), student)
      }
    }

    const eventMap = new Map(events.map((event) => [String(event._id), event]))

    const items = attendanceRows.rows.map((row, index) => {
      const student = studentMap.get(String(row.student_id))
      const event = eventMap.get(String(row.event_id))
      return {
        id: `${row.student_id}-${row.event_id}-${index}`,
        studentName: student?.fullName || student?.name || 'Unknown Student',
        studentId: row.student_id,
        department: student?.department || 'N/A',
        eventName: event?.title || 'Unknown Event',
        attendanceStatus: String(row.status || '').toLowerCase() === 'present' ? 'Present' : 'Absent',
        checkInTime: row.scanned_at,
      }
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Faculty attendance error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
