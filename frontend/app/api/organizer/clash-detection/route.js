import { NextResponse } from 'next/server'
import { ensureStudentEventCollections, getEventsCollection } from '../../_lib/db'

export async function POST(request) {
  try {
    await ensureStudentEventCollections()
    const eventsCollection = await getEventsCollection()

    const body = await request.json()
    const venue = String(body.venue || '').trim()
    const startDate = String(body.start_date || '').trim()
    const endDate = String(body.end_date || body.start_date || '').trim()
    const startTime = String(body.start_time || '').trim()
    const endTime = String(body.end_time || '').trim()

    if (!venue || !startDate || !startTime) {
      return NextResponse.json(
        { message: 'Venue, start date, and start time are required.' },
        { status: 400 }
      )
    }

    // Find events at the same venue that overlap with the date range
    const query = {
      venue: { $regex: `^${venue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      status: { $nin: ['rejected', 'cancelled'] },
      $or: [
        // Events where start_date falls within our range
        { start_date: { $gte: startDate, $lte: endDate } },
        // Events where end_date falls within our range
        { end_date: { $gte: startDate, $lte: endDate } },
        // Events that span our entire range
        { start_date: { $lte: startDate }, end_date: { $gte: endDate } },
        // Legacy date field
        { date: { $gte: startDate, $lte: endDate } },
      ],
    }

    const overlappingEvents = await eventsCollection.find(query).toArray()

    // Check time overlap for events on the same date
    const clashes = overlappingEvents.filter((event) => {
      const evStart = event.start_time || event.time || ''
      const evEnd = event.end_time || event.start_time || event.time || ''
      const reqEnd = endTime || startTime

      // Simple time overlap check
      if (evStart && startTime) {
        const evStartMin = timeToMinutes(evStart)
        const evEndMin = timeToMinutes(evEnd) || evStartMin + 60
        const reqStartMin = timeToMinutes(startTime)
        const reqEndMin = timeToMinutes(reqEnd) || reqStartMin + 60

        return reqStartMin < evEndMin && reqEndMin > evStartMin
      }
      return true // If no time info, assume clash
    })

    const clashItems = clashes.map((e) => ({
      title: e.title,
      start_date: e.start_date || e.date,
      end_date: e.end_date || e.start_date || e.date,
      start_time: e.start_time || e.time,
      end_time: e.end_time || '',
      status: e.status,
    }))

    if (clashItems.length > 0) {
      return NextResponse.json({
        hasClash: true,
        message: `Found ${clashItems.length} event(s) at "${venue}" that overlap with your schedule.`,
        clashes: clashItems,
      })
    }

    return NextResponse.json({
      hasClash: false,
      message: `No scheduling conflicts found at "${venue}" for the selected date and time.`,
      clashes: [],
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Clash detection failed.', detail: error.message },
      { status: 500 }
    )
  }
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0
  const [h, m] = String(timeStr).split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}
