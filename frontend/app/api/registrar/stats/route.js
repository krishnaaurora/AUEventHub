import { NextResponse } from 'next/server'
import { requireRegistrarAccess } from '../_lib/auth'
import {
  ensureStudentEventCollections,
  getEventsCollection,
  getEventApprovalsCollection,
} from '../../_lib/db'

export async function GET() {
  try {
    const auth = await requireRegistrarAccess()
    if (auth.response) return auth.response

    await ensureStudentEventCollections()
    const eventsCol = await getEventsCollection()
    const approvalsCol = await getEventApprovalsCollection()

    // Get current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Count events pending registrar approval
    const pendingCount = await eventsCol.countDocuments({
      status: 'pending_registrar'
    })

    // Count events approved by registrar
    const approvedEvents = await eventsCol.find({
      status: { $in: ['pending_vc', 'approved', 'published', 'completed'] }
    }).toArray()

    const approvedEventIds = approvedEvents.map(e => String(e._id))
    const approvedApprovals = await approvalsCol.find({
      event_id: { $in: approvedEventIds },
      registrar_status: 'approved'
    }).toArray()

    // Count events rejected by registrar
    const rejectedApprovals = await approvalsCol.countDocuments({
      registrar_status: 'rejected'
    })

    // Count events submitted this month
    const thisMonthCount = await eventsCol.countDocuments({
      created_at: { $gte: startOfMonth, $lte: endOfMonth }
    })

    return NextResponse.json({
      pending: pendingCount,
      approved: approvedApprovals.length,
      rejected: rejectedApprovals,
      thisMonth: thisMonthCount,
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch registrar stats.', detail: error.message },
      { status: 500 }
    )
  }
}