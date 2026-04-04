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

    const reqStartMin = timeToMinutes(startTime)
    const reqEndMin = timeToMinutes(endTime || startTime) || reqStartMin + 60

    // Find all events at the same venue on the same date to check for clashes and find gaps
    const query = {
      venue: { $regex: `^${venue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      status: { $nin: ['rejected', 'cancelled'] },
      $or: [
        { start_date: { $gte: startDate, $lte: endDate } },
        { end_date: { $gte: startDate, $lte: endDate } },
        { start_date: { $lte: startDate }, end_date: { $gte: endDate } },
        { date: { $gte: startDate, $lte: endDate } },
      ],
    }

    const overlappingEvents = await eventsCollection.find(query).toArray()

    const clashes = overlappingEvents.filter((event) => {
      const evStart = event.start_time || event.time || ''
      const evEnd = event.end_time || evStart || ''
      
      const evStartMin = timeToMinutes(evStart)
      const evEndMin = timeToMinutes(evEnd) || evStartMin + 60

      return reqStartMin < evEndMin && reqEndMin > evStartMin
    })

    const clashItems = clashes.map((e) => ({
      title: e.title,
      start_date: e.start_date || e.date,
      start_time: e.start_time || e.time,
      end_time: e.end_time || '',
    }))

    if (clashItems.length > 0) {
      // Find a suggestion
      const busySlots = overlappingEvents.map(e => {
        const s = timeToMinutes(e.start_time || e.time)
        const f = timeToMinutes(e.end_time || e.start_time || e.time) || s + 60
        return { s, f }
      }).sort((a, b) => a.s - b.s)

      // Find first available slot after 8 AM (480 mins)
      let suggestion = ''
      let currentTime = 480 // 8:00 AM
      const duration = reqEndMin - reqStartMin

      for (const slot of busySlots) {
        if (slot.s - currentTime >= duration) {
          suggestion = minutesToTime(currentTime)
          break
        }
        currentTime = Math.max(currentTime, slot.f)
      }

      if (!suggestion) {
        suggestion = minutesToTime(currentTime) // Suggest after the last event
      }

      return NextResponse.json({
        hasClash: true,
        message: `Venue "${venue}" is busy at ${startTime}.`,
        suggestion: `Suggested: ${suggestion} on ${startDate}`,
        clashes: clashItems,
      })
    }

    return NextResponse.json({
      hasClash: false,
      message: `No scheduling conflicts found at "${venue}".`,
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

function minutesToTime(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayH = h % 12 || 12
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
}
