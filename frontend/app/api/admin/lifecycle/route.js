import { NextResponse } from 'next/server'
import {
  ensureStudentEventCollections,
  getNotificationsCollection,
  getEventReportsCollection,
  getEventsCollection,
} from '../../_lib/db'
import { runEventLifecycleAutomation } from '../../_lib/event-lifecycle'
import { requireAdminAccess } from '../_lib/auth'

export async function GET() {
  try {
    const auth = await requireAdminAccess()
    if (auth.response) return auth.response

    await ensureStudentEventCollections()
    const notificationsCollection = await getNotificationsCollection()
    const reportsCollection = await getEventReportsCollection()
    const eventsCollection = await getEventsCollection()

    const [latestRun, reportsCount, eventStatusSummary] = await Promise.all([
      notificationsCollection.findOne(
        { role: 'admin', type: 'lifecycle_summary' },
        { sort: { created_at: -1 } },
      ),
      reportsCollection.countDocuments({}),
      eventsCollection
        .aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ])
        .toArray(),
    ])

    return NextResponse.json({
      latestRun: latestRun?.meta || null,
      latestRunCreatedAt: latestRun?.created_at || null,
      reportsCount,
      eventStatusSummary,
    })
  } catch (error) {
    console.error('Admin lifecycle GET error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  try {
    const auth = await requireAdminAccess()
    if (auth.response) return auth.response

    const result = await runEventLifecycleAutomation()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Admin lifecycle POST error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
