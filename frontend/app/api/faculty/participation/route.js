export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ensureStudentEventCollections, getUsersCollection } from '../../_lib/db'
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

    const [registrations, attendance, certificates] = await Promise.all([
      pool.query(
        `SELECT student_id, COUNT(*)::int AS events_registered
         FROM registrations
         GROUP BY student_id`,
      ),
      pool.query(
        `SELECT student_id, COUNT(*)::int AS events_attended
         FROM attendance
         WHERE LOWER(status) = 'present'
         GROUP BY student_id`,
      ),
      pool.query(
        `SELECT student_id, COUNT(*)::int AS certificates_earned
         FROM certificates
         GROUP BY student_id`,
      ),
    ])

    const registeredMap = new Map(registrations.rows.map((row) => [String(row.student_id), row]))
    const attendedMap = new Map(attendance.rows.map((row) => [String(row.student_id), row]))
    const certMap = new Map(certificates.rows.map((row) => [String(row.student_id), row]))

    const studentIds = Array.from(
      new Set([...registeredMap.keys(), ...attendedMap.keys(), ...certMap.keys()]),
    )

    const students = await usersCollection
      .find({
        $or: [
          { _id: { $in: studentIds } },
          { registrationId: { $in: studentIds } },
          { student_id: { $in: studentIds } },
        ],
      })
      .toArray()

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

    const items = studentIds.map((studentId) => {
      const student = studentMap.get(String(studentId))
      return {
        studentId,
        studentName: student?.fullName || student?.name || 'Unknown Student',
        department: student?.department || 'N/A',
        eventsRegistered: Number(registeredMap.get(String(studentId))?.events_registered || 0),
        eventsAttended: Number(attendedMap.get(String(studentId))?.events_attended || 0),
        certificatesEarned: Number(certMap.get(String(studentId))?.certificates_earned || 0),
      }
    })

    items.sort((a, b) => b.eventsAttended - a.eventsAttended)

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Faculty participation error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
