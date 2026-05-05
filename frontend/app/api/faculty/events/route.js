export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import {
  ensureStudentEventCollections,
  getEventsCollection,
  getEventTrendingCollection,
} from '../../_lib/db'
import { ensureStudentTransactionTables, getPool } from '../../_lib/pg'
import { requireFacultyAccess } from '../_lib/auth'

function toPositiveInt(value, fallback) {
  const num = Number.parseInt(value, 10)
  return Number.isFinite(num) && num >= 0 ? num : fallback
}

export async function GET(request) {
  try {
    const auth = await requireFacultyAccess()
    if (auth.response) return auth.response

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const limit = toPositiveInt(searchParams.get('limit'), 24)
    const offset = toPositiveInt(searchParams.get('offset'), 0)

    await ensureStudentEventCollections()
    await ensureStudentTransactionTables()

    const eventsCollection = await getEventsCollection()
    const trendingCollection = await getEventTrendingCollection()
    const pool = getPool()

    const match = { status: { $in: ['approved', 'published', 'completed'] } }
    const today = new Date().toISOString().slice(0, 10)

    if (filter === 'live') {
      match.start_date = { $lte: today }
      match.end_date = { $gte: today }
    }

    const events = await eventsCollection
      .find(match)
      .sort({ start_date: 1 })
      .skip(offset)
      .limit(limit)
      .toArray()

    const eventIds = events.map((event) => String(event._id))

    const registrationsByEvent = new Map()
    const attendanceByEvent = new Map()

    if (eventIds.length > 0) {
      const [registrationRows, attendanceRows, trendRows] = await Promise.all([
        pool.query(
          `SELECT event_id, COUNT(*)::int AS count
           FROM registrations
           WHERE event_id = ANY($1)
           GROUP BY event_id`,
          [eventIds],
        ),
        pool.query(
          `SELECT event_id, COUNT(*)::int AS count
           FROM attendance
           WHERE event_id = ANY($1) AND LOWER(status) = 'present'
           GROUP BY event_id`,
          [eventIds],
        ),
        trendingCollection.find({ event_id: { $in: eventIds } }).toArray(),
      ])

      for (const row of registrationRows.rows) {
        registrationsByEvent.set(String(row.event_id), Number(row.count || 0))
      }
      for (const row of attendanceRows.rows) {
        attendanceByEvent.set(String(row.event_id), Number(row.count || 0))
      }
      const trendMap = new Map(trendRows.map((row) => [String(row.event_id), row]))

      return NextResponse.json({
        items: events.map((event) => {
          const id = String(event._id)
          return {
            ...event,
            _id: id,
            registrations: registrationsByEvent.get(id) || 0,
            attendanceCount: attendanceByEvent.get(id) || 0,
            trending: trendMap.get(id) || null,
          }
        }),
        total: await eventsCollection.countDocuments(match),
        limit,
        offset,
      })
    }

    return NextResponse.json({ items: [], total: 0, limit, offset })
  } catch (error) {
    console.error('Faculty events error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
