import { NextResponse } from 'next/server'
import {
  ensureStudentEventCollections,
  getEventsCollection,
  getEventApprovalsCollection,
} from '../../_lib/db'
import { requireDeanAccess } from '../_lib/auth'

export async function GET() {
  try {
    const auth = await requireDeanAccess()
    if (auth.response) return auth.response

    await ensureStudentEventCollections()
    const eventsCol = await getEventsCollection()
    const approvalsCol = await getEventApprovalsCollection()

    const now = new Date().toISOString().slice(0, 7) // YYYY-MM

    const [
      pendingCount,
      approvedCount,
      rejectedCount,
      thisMonthCount,
    ] = await Promise.all([
      eventsCol.countDocuments({
        status: { $in: ['pending_dean', 'pending'] },
      }),
      approvalsCol.countDocuments({ dean_status: 'approved' }),
      approvalsCol.countDocuments({ dean_status: 'rejected' }),
      eventsCol.countDocuments({
        created_at: { $regex: `^${now}` },
      }),
    ])

    return NextResponse.json({
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      thisMonth: thisMonthCount,
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch dean stats.', detail: error.message },
      { status: 500 }
    )
  }
}
