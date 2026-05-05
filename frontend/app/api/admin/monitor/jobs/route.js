export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import {
  ensureStudentEventCollections,
  getNotificationsCollection,
  getEventReportsCollection,
} from '../../../_lib/db'
import { requireAdminAccess } from '../../_lib/auth'

export async function GET() {
  try {
    const auth = await requireAdminAccess()
    if (auth.response) return auth.response

    await ensureStudentEventCollections()

    const notificationsCollection = await getNotificationsCollection()
    const reportsCollection = await getEventReportsCollection()

    const [runs, latestReports] = await Promise.all([
      notificationsCollection
        .find({ type: 'lifecycle_summary' })
        .sort({ created_at: -1 })
        .limit(20)
        .toArray(),
      reportsCollection
        .find({})
        .sort({ generated_at: -1 })
        .limit(20)
        .toArray(),
    ])

    return NextResponse.json({
      lifecycleRuns: runs.map((run) => ({
        _id: String(run._id),
        created_at: run.created_at,
        title: run.title,
        message: run.message,
        meta: run.meta || null,
      })),
      latestReports: latestReports.map((item) => ({
        _id: String(item._id),
        event_id: item.event_id,
        total_registrations: item.total_registrations || 0,
        total_attendance: item.total_attendance || 0,
        attendance_rate: item.attendance_rate || 0,
        generated_at: item.generated_at || null,
      })),
      cronSchedules: ['0 * * * *', '0 2 * * *'],
    })
  } catch (error) {
    console.error('Admin jobs monitor error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
