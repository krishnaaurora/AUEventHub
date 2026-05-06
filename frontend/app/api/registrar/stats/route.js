export const dynamic = 'force-dynamic'
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

    // 1. Fetch basic metrics
    const [totalEvents, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      eventsCol.countDocuments({}),
      eventsCol.countDocuments({ status: 'pending_registrar' }),
      approvalsCol.countDocuments({ registrar_status: 'approved' }),
      approvalsCol.countDocuments({ registrar_status: 'rejected' })
    ])

    // 3. Aggregate Department Stats (Top 8)
    const deptPipeline = [
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]
    const depts = await eventsCol.aggregate(deptPipeline).toArray()
    const departmentStats = depts.reduce((acc, d) => {
      acc[d._id || 'Unknown'] = d.count
      return acc
    }, {})

    // 4. Aggregate Venue Stats (Top 8)
    const venuePipeline = [
      { $group: { _id: '$venue', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]
    const venues = await eventsCol.aggregate(venuePipeline).toArray()
    const venueStats = venues.reduce((acc, v) => {
      acc[v._id || 'TBD'] = v.count
      return acc
    }, {})

    // 5. Aggregate Monthly Trends (Last 6 Months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const monthlyEvents = await eventsCol.find({
      created_at: { $gte: sixMonthsAgo }
    }).project({ created_at: 1 }).toArray()

    const monthlyStats = monthlyEvents.reduce((acc, e) => {
      const date = e.created_at || new Date()
      const month = new Date(date).toLocaleString('default', { month: 'short', year: 'numeric' })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {})

    // 6. Expected Participation average (mock or from data)
    const allEventsForAttendance = await eventsCol.find({}).project({ max_participants: 1 }).toArray()
    const totalMax = allEventsForAttendance.reduce((sum, e) => sum + (parseInt(e.max_participants) || 0), 0)
    const avgAttendance = Math.round(totalMax / Math.max(totalEvents, 1))

    return NextResponse.json({
      totalEvents,
      approvedEvents: approvedCount,
      pendingEvents: pendingCount,
      rejectedEvents: rejectedCount,
      departmentStats,
      venueStats,
      monthlyStats,
      averageAttendance: avgAttendance,
      totalExpectedAttendance: totalMax
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch registrar stats.', detail: error.message },
      { status: 500 }
    )
  }
}