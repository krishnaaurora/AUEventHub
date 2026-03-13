import { NextResponse } from 'next/server'
import {
  ensureStudentEventCollections,
  getEventsCollection,
} from '../../_lib/db'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { requireFacultyAccess } from '../_lib/auth'

function startOfMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export async function GET() {
  try {
    const auth = await requireFacultyAccess()
    if (auth.response) return auth.response

    await ensureStudentEventCollections()
    await ensureStudentTransactionTables()

    const eventsCollection = await getEventsCollection()
    const pool = getPool()

    const monthStart = startOfMonth().toISOString().slice(0, 10)

    const [
      totalEventsThisMonth,
      mostActiveDepartmentDoc,
      registrationsCount,
      attendanceStats,
    ] = await Promise.all([
      eventsCollection.countDocuments({
        status: { $in: ['approved', 'published', 'completed'] },
        start_date: { $gte: monthStart },
      }),
      eventsCollection
        .aggregate([
          { $match: { status: { $in: ['approved', 'published', 'completed'] } } },
          { $group: { _id: '$department', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 },
        ])
        .toArray()
        .then((rows) => rows[0] || null),
      pool
        .query('SELECT COUNT(*)::int AS total FROM registrations')
        .then((r) => r.rows[0]?.total || 0),
      pool
        .query(
          `SELECT
            COUNT(*) FILTER (WHERE LOWER(status) = 'present')::int AS present_count,
            COUNT(*)::int AS total_count
          FROM attendance`,
        )
        .then((r) => r.rows[0] || { present_count: 0, total_count: 0 }),
    ])

    const present = Number(attendanceStats.present_count || 0)
    const total = Number(attendanceStats.total_count || 0)
    const averageAttendanceRate = total > 0 ? Math.round((present / total) * 100) : 0

    return NextResponse.json({
      totalEventsThisMonth,
      totalStudentsParticipating: registrationsCount,
      averageAttendanceRate,
      mostActiveDepartment: mostActiveDepartmentDoc?._id || 'N/A',
    })
  } catch (error) {
    console.error('Faculty stats error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
