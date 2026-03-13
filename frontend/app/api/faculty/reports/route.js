import { NextResponse } from 'next/server'
import {
  ensureStudentEventCollections,
  getEventsCollection,
  getEventReportsCollection,
} from '../../_lib/db'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { requireFacultyAccess } from '../_lib/auth'

export async function GET() {
  try {
    const auth = await requireFacultyAccess()
    if (auth.response) return auth.response

    await ensureStudentEventCollections()
    await ensureStudentTransactionTables()

    const eventsCollection = await getEventsCollection()
    const reportsCollection = await getEventReportsCollection()
    const pool = getPool()

    const lifecycleStatuses = ['approved', 'published', 'completed']
    const prebuiltReports = await reportsCollection
      .find({})
      .sort({ generated_at: -1 })
      .limit(100)
      .toArray()

    if (prebuiltReports.length > 0) {
      const eventIds = prebuiltReports.map((report) => String(report.event_id))
      const events = await eventsCollection
        .find({ _id: { $in: eventIds }, status: { $in: lifecycleStatuses } })
        .toArray()

      const eventMap = new Map(events.map((event) => [String(event._id), event]))

      const attendanceRateByEvent = prebuiltReports
        .filter((report) => eventMap.has(String(report.event_id)))
        .slice(0, 10)
        .map((report) => ({
          name: eventMap.get(String(report.event_id))?.title || String(report.event_id),
          rate: Number(report.attendance_rate || 0),
        }))

      const departmentMap = new Map()
      for (const report of prebuiltReports) {
        const event = eventMap.get(String(report.event_id))
        if (!event) continue

        const dept = event.department || report.top_department || 'N/A'
        const current = departmentMap.get(dept) || { participants: 0, attendance: 0, events: 0 }
        departmentMap.set(dept, {
          participants: current.participants + Number(report.total_registrations || 0),
          attendance: current.attendance + Number(report.total_attendance || 0),
          events: current.events + 1,
        })
      }

      const departmentEngagement = Array.from(departmentMap.entries()).map(([department, value]) => ({
        department,
        participants: value.participants,
        attendance: value.attendance,
        events: value.events,
      }))

      return NextResponse.json({
        attendanceRateByEvent,
        registrationTrends: [],
        participationTrends: [],
        departmentEngagement,
      })
    }

    const [events, registrations, attendance] = await Promise.all([
      eventsCollection.find({ status: { $in: lifecycleStatuses } }).toArray(),
      pool.query('SELECT event_id, student_id, registered_at FROM registrations'),
      pool.query('SELECT event_id, student_id, status, scanned_at FROM attendance'),
    ])

    const regByEvent = new Map()
    const attByEvent = new Map()

    for (const row of registrations.rows) {
      const key = String(row.event_id)
      regByEvent.set(key, (regByEvent.get(key) || 0) + 1)
    }

    for (const row of attendance.rows) {
      if (String(row.status || '').toLowerCase() !== 'present') continue
      const key = String(row.event_id)
      attByEvent.set(key, (attByEvent.get(key) || 0) + 1)
    }

    const attendanceRateByEvent = events.slice(0, 10).map((event) => {
      const id = String(event._id)
      const regs = regByEvent.get(id) || 0
      const atts = attByEvent.get(id) || 0
      const rate = regs > 0 ? Math.round((atts / regs) * 100) : 0
      return { name: event.title, rate }
    })

    const registrationTrendMap = new Map()
    const attendanceTrendMap = new Map()

    for (const row of registrations.rows) {
      const date = new Date(row.registered_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      registrationTrendMap.set(key, (registrationTrendMap.get(key) || 0) + 1)
    }

    for (const row of attendance.rows) {
      if (String(row.status || '').toLowerCase() !== 'present') continue
      const date = new Date(row.scanned_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      attendanceTrendMap.set(key, (attendanceTrendMap.get(key) || 0) + 1)
    }

    const months = Array.from(new Set([...registrationTrendMap.keys(), ...attendanceTrendMap.keys()])).sort()

    const registrationTrends = months.map((month) => ({
      month,
      registrations: registrationTrendMap.get(month) || 0,
      attendance: attendanceTrendMap.get(month) || 0,
    }))

    const departmentMap = new Map()
    for (const event of events) {
      const dept = event.department || 'N/A'
      const id = String(event._id)
      const regs = regByEvent.get(id) || 0
      const atts = attByEvent.get(id) || 0
      const current = departmentMap.get(dept) || { participants: 0, attendance: 0, events: 0 }
      departmentMap.set(dept, {
        participants: current.participants + regs,
        attendance: current.attendance + atts,
        events: current.events + 1,
      })
    }

    const departmentEngagement = Array.from(departmentMap.entries()).map(([department, value]) => ({
      department,
      participants: value.participants,
      attendance: value.attendance,
      events: value.events,
    }))

    return NextResponse.json({
      attendanceRateByEvent,
      registrationTrends,
      participationTrends: registrationTrends,
      departmentEngagement,
    })
  } catch (error) {
    console.error('Faculty reports error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
