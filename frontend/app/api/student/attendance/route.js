import { NextResponse } from 'next/server'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { getEventsCollection, ensureStudentEventCollections } from '../../_lib/db'
import { requireStudentAccess } from '../_lib/auth'

export async function GET(request) {
  try {
    const auth = await requireStudentAccess()
    if (auth.response) return auth.response
    const studentId = auth.session.user.registrationId || auth.session.user.id

    await ensureStudentTransactionTables()
    const pool = getPool()

    // Get attendance records
    const attendanceRes = await pool.query(
      'SELECT a.*, r.registration_date, r.ticket_id FROM attendance a JOIN registrations r ON a.student_id = r.student_id AND a.event_id = r.event_id WHERE a.student_id = $1 ORDER BY a.scanned_at DESC',
      [studentId]
    )

    if (attendanceRes.rowCount === 0) {
      return NextResponse.json({ items: [] })
    }

    // Get event details for these attendances
    const items = attendanceRes.rows

    await ensureStudentEventCollections()
    const eventsCol = await getEventsCollection()
    
    const eventIds = [...new Set(items.map(i => i.event_id))]
    
    const ObjectId = require('mongodb').ObjectId
    const objectIds = eventIds.map(id => {
      try { return new ObjectId(id) } catch { return id }
    })
    
    const events = await eventsCol.find({
      $or: [
        { _id: { $in: objectIds } },
        { _id: { $in: eventIds } }
      ]
    }).toArray()
    
    // Map event details
    const eventMap = {}
    events.forEach(e => { eventMap[String(e._id)] = e })

    const enrichedItems = items.map(item => {
      const e = eventMap[item.event_id] || {}
      return {
        ...item,
        event_title: e.title || 'Unknown Event',
        event_date: e.date || e.start_date || 'N/A',
        event_poster: e.poster || null,
        organizer: e.organizer || e.organizer_id || 'Unknown',
        cert_eligible: item.status === 'attended'
      }
    })

    return NextResponse.json({ items: enrichedItems })

  } catch (error) {
    console.error('Attendance fetch error:', error)
    return NextResponse.json({ message: 'Failed to fetch attendance', detail: error.message }, { status: 500 })
  }
}
