export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import {
  ensureStudentEventCollections,
  getEventsCollection,
  getEventDetailsCollection,
  getEventTrendingCollection,
  getEventViewsCollection,
} from '../../../_lib/db'
import { ensureStudentTransactionTables, getPool } from '../../../_lib/pg'
import { requireFacultyAccess } from '../../_lib/auth'

export async function GET(request, { params }) {
  try {
    const auth = await requireFacultyAccess()
    if (auth.response) return auth.response

    await ensureStudentEventCollections()
    await ensureStudentTransactionTables()

    const eventId = params?.id
    if (!eventId) {
      return NextResponse.json({ message: 'Event id is required' }, { status: 400 })
    }

    const eventsCollection = await getEventsCollection()
    const detailsCollection = await getEventDetailsCollection()
    const trendingCollection = await getEventTrendingCollection()
    const viewsCollection = await getEventViewsCollection()
    const pool = getPool()

    const objectId = ObjectId.isValid(eventId) ? new ObjectId(eventId) : eventId
    const event = await eventsCollection.findOne({ _id: objectId })

    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const [details, trending, views, regRow, attRow] = await Promise.all([
      detailsCollection.findOne({ event_id: String(event._id) }),
      trendingCollection.findOne({ event_id: String(event._id) }),
      viewsCollection.findOne({ event_id: String(event._id) }),
      pool.query('SELECT COUNT(*)::int AS total FROM registrations WHERE event_id = $1', [
        String(event._id),
      ]),
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM attendance
         WHERE event_id = $1 AND LOWER(status) = 'present'`,
        [String(event._id)],
      ),
    ])

    const totalRegistrations = regRow.rows[0]?.total || 0
    const totalAttendance = attRow.rows[0]?.total || 0
    const participationRate =
      Number(totalRegistrations) > 0
        ? Math.round((Number(totalAttendance) / Number(totalRegistrations)) * 100)
        : 0

    return NextResponse.json({
      ...event,
      _id: String(event._id),
      details,
      trending,
      views,
      stats: {
        totalRegistrations,
        totalAttendance,
        participationRate,
      },
    })
  } catch (error) {
    console.error('Faculty event details error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
