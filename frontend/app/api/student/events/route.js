export const dynamic = 'force-dynamic'
import { ensureStudentEventCollections, getEventsCollection } from '../../_lib/db'
import { emitSocketEvent } from '../../../../server/socket'
import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

function toPositiveInt(value, fallback) {
  const num = Number.parseInt(value, 10)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0
  const [h, m] = String(timeStr).split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export async function GET(request) {
  try {
    await ensureStudentEventCollections()
    const eventsCollection = await getEventsCollection()

    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = String(searchParams.get('q') || '').trim()
    const category = String(searchParams.get('category') || '').trim()
    const status = String(searchParams.get('status') || '').trim()
    const page = toPositiveInt(searchParams.get('page'), 1)
    const limit = toPositiveInt(searchParams.get('limit'), 20)

    const query = {}
    if (category) query.category = category
    if (status) query.status = status

    // Role-based filtering
    if (session.user.role === 'organizer') {
      const organizerId = session.user.registrationId || session.user.id
      query.organizer_id = String(organizerId)
    } else {
      const organizerIdParam = String(searchParams.get('organizer_id') || '').trim()
      const organizerParam = String(searchParams.get('organizer') || '').trim()
      if (organizerIdParam) {
        query.organizer_id = organizerIdParam
      } else if (organizerParam) {
        query.organizer = organizerParam
      }
    }
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { venue: { $regex: q, $options: 'i' } },
      ]
    }

    console.time("API")

    const skip = (page - 1) * limit
    const [items, total] = await Promise.all([
      eventsCollection.find(query).sort({ start_date: 1, start_time: 1, date: 1, time: 1 }).skip(skip).limit(limit).toArray(),
      eventsCollection.countDocuments(query),
    ])

    const normalizedItems = items.map((item) => ({
      ...item,
      _id: String(item._id),
    }))

    const responseData = {
      items: normalizedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    }

    console.timeEnd("API")

    return NextResponse.json(responseData)
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch events.', detail: error.message },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    await ensureStudentEventCollections()
    const eventsCollection = await getEventsCollection()

    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'organizer' && session.user.role !== 'admin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const title = String(body.title || '').trim()
    const category = String(body.category || '').trim()
    const venue = String(body.venue || '').trim()
    const startDate = String(body.start_date || body.date || '').trim()
    const endDate = String(body.end_date || body.date || '').trim()
    const startTime = String(body.start_time || body.time || '').trim()
    const endTime = String(body.end_time || body.time || '').trim()
    
    // Force organizer details from session
    const organizerId = session.user.registrationId || session.user.id
    const organizerName = session.user.name || session.user.email

    const description = String(body.description || '').trim()
    const seats = Number(body.seats || body.max_participants)
    const registeredCount = Number(body.registered_count || 0)
    const status = session.user.role === 'admin' ? String(body.status || 'approved').toLowerCase() : 'pending_dean'
    const department = String(body.department || '').trim()
    const guestSpeakers = String(body.guest_speakers || '').trim()
    const instructions = String(body.instructions || '').trim()
    const poster = String(body.poster || '').trim()
    const maxParticipants = Number(body.max_participants || body.seats || 0)

    if (!title || !category || !venue || !startDate || !startTime || !organizerName || !description) {
      return NextResponse.json({ message: 'Missing required event fields.' }, { status: 400 })
    }

    if (!Number.isFinite(seats) || seats <= 0) {
      return NextResponse.json({ message: 'seats must be a positive number.' }, { status: 400 })
    }

    if (!Number.isFinite(registeredCount) || registeredCount < 0) {
      return NextResponse.json({ message: 'registered_count must be 0 or greater.' }, { status: 400 })
    }

    // --- Automatic Clash Detection ---
    const clashQuery = {
      venue: { $regex: `^${venue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      status: { $nin: ['rejected', 'cancelled'] },
      $or: [
        { start_date: { $gte: startDate, $lte: endDate || startDate } },
        { end_date: { $gte: startDate, $lte: endDate || startDate } },
        { start_date: { $lte: startDate }, end_date: { $gte: endDate || startDate } },
        { date: { $gte: startDate, $lte: endDate || startDate } },
      ],
    }

    const overlappingEvents = await eventsCollection.find(clashQuery).toArray()
    const clashes = overlappingEvents.filter((event) => {
      const evStart = event.start_time || event.time || ''
      const evEnd = event.end_time || event.start_time || event.time || ''
      const reqEnd = endTime || startTime

      if (evStart && startTime) {
        const evStartMin = timeToMinutes(evStart)
        const evEndMin = timeToMinutes(evEnd) || evStartMin + 60
        const reqStartMin = timeToMinutes(startTime)
        const reqEndMin = timeToMinutes(reqEnd) || reqStartMin + 60
        return reqStartMin < evEndMin && reqEndMin > evStartMin
      }
      return true
    })

    if (clashes.length > 0) {
      return NextResponse.json(
        { message: 'Venue conflict: Another event is scheduled in this room at the same time.' },
        { status: 409 }
      )
    }
    // ---------------------------------

    const payload = {
      ...(body._id ? { _id: String(body._id) } : {}),
      title,
      category,
      venue,
      start_date: startDate,
      end_date: endDate || startDate,
      start_time: startTime,
      end_time: endTime || startTime,
      date: startDate,
      time: startTime,
      organizer: organizerName,
      organizer_id: String(organizerId),
      description,
      seats,
      max_participants: maxParticipants || seats,
      registered_count: registeredCount,
      status,
      ...(department ? { department } : {}),
      ...(guestSpeakers ? { guest_speakers: guestSpeakers } : {}),
      ...(instructions ? { instructions } : {}),
      ...(poster ? { poster } : {}),
      created_at: new Date().toISOString().slice(0, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await eventsCollection.insertOne(payload)
    const createdEvent = {
      ...payload,
      _id: String(result.insertedId),
    }

    emitSocketEvent('event:new', createdEvent)
    emitSocketEvent('dashboard:refresh', { scope: 'student' })
    emitSocketEvent('dashboard:refresh', { scope: 'organizer' }, 'role:organizer')


    return NextResponse.json(
      {
        message: 'Event created successfully.',
        id: String(result.insertedId),
      },
      { status: 201 },
    )
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ message: 'Event ID already exists.' }, { status: 409 })
    }

    return NextResponse.json(
      { message: 'Failed to create event.', detail: error.message },
      { status: 500 },
    )
  }
}
export async function PUT(request) {
  try {
    await ensureStudentEventCollections()
    const eventsCollection = await getEventsCollection()

    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const id = body.id || body._id
    if (!id) {
      return NextResponse.json({ message: 'Event ID is required for updates.' }, { status: 400 })
    }

    let filter
    try {
      filter = { _id: new ObjectId(id) }
    } catch {
      filter = { _id: id }
    }

    // Role-based Update Restriction
    if (session.user.role === 'organizer') {
      const organizerId = session.user.registrationId || session.user.id
      filter.organizer_id = String(organizerId)
    }

    // Capture fields to update
    const updateData = {
      updatedAt: new Date(),
    }

    const fields = [
      'title', 'category', 'venue', 'start_date', 'end_date', 'start_time', 'end_time',
      'description', 'max_participants', 'guest_speakers', 'instructions', 'poster',
      'department', 'status'
    ]

    fields.forEach(f => {
      if (body[f] !== undefined) {
        if (f === 'max_participants') {
          updateData[f] = Number(body[f])
          updateData['seats'] = Number(body[f])
        } else {
          updateData[f] = body[f]
        }
      }
    })

    const result = await eventsCollection.findOneAndUpdate(
      filter,
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json({ message: 'Event not found.' }, { status: 404 })
    }


    emitSocketEvent('dashboard:refresh', { scope: 'student' })
    emitSocketEvent('dashboard:refresh', { scope: 'organizer' })
    emitSocketEvent('dashboard:refresh', { scope: 'dean' })

    return NextResponse.json({
      message: 'Event updated successfully.',
      event: result
    })
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to update event.', detail: error.message },
      { status: 500 },
    )
  }
}
