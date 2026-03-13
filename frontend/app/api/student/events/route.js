import { NextResponse } from 'next/server'
import { ensureStudentEventCollections, getEventsCollection } from '../../_lib/db'
import { emitSocketEvent } from '../../../../server/socket'

function toPositiveInt(value, fallback) {
  const num = Number.parseInt(value, 10)
  return Number.isFinite(num) && num > 0 ? num : fallback
}

export async function GET(request) {
  try {
    await ensureStudentEventCollections()
    const eventsCollection = await getEventsCollection()

    const { searchParams } = new URL(request.url)
    const q = String(searchParams.get('q') || '').trim()
    const category = String(searchParams.get('category') || '').trim()
    const status = String(searchParams.get('status') || '').trim()
    const page = toPositiveInt(searchParams.get('page'), 1)
    const limit = toPositiveInt(searchParams.get('limit'), 20)

    const query = {}
    if (category) {
      query.category = category
    }
    if (status) {
      query.status = status
    }
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { venue: { $regex: q, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit
    const [items, total] = await Promise.all([
      eventsCollection.find(query).sort({ start_date: 1, start_time: 1, date: 1, time: 1 }).skip(skip).limit(limit).toArray(),
      eventsCollection.countDocuments(query),
    ])

    const normalizedItems = items.map((item) => ({
      ...item,
      _id: String(item._id),
    }))

    return NextResponse.json({
      items: normalizedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
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

    const body = await request.json()
    const title = String(body.title || '').trim()
    const category = String(body.category || '').trim()
    const venue = String(body.venue || '').trim()
    const startDate = String(body.start_date || body.date || '').trim()
    const endDate = String(body.end_date || body.date || '').trim()
    const startTime = String(body.start_time || body.time || '').trim()
    const endTime = String(body.end_time || body.time || '').trim()
    const organizer = String(body.organizer || '').trim()
    const organizerId = String(body.organizer_id || '').trim()
    const description = String(body.description || '').trim()
    const seats = Number(body.seats || body.max_participants)
    const registeredCount = Number(body.registered_count || 0)
    const status = String(body.status || 'approved').trim().toLowerCase()
    const department = String(body.department || '').trim()
    const guestSpeakers = String(body.guest_speakers || '').trim()
    const instructions = String(body.instructions || '').trim()
    const poster = String(body.poster || '').trim()
    const maxParticipants = Number(body.max_participants || body.seats || 0)

    if (!title || !category || !venue || !startDate || !startTime || !organizer || !description) {
      return NextResponse.json({ message: 'Missing required event fields.' }, { status: 400 })
    }

    if (!Number.isFinite(seats) || seats <= 0) {
      return NextResponse.json({ message: 'seats must be a positive number.' }, { status: 400 })
    }

    if (!Number.isFinite(registeredCount) || registeredCount < 0) {
      return NextResponse.json({ message: 'registered_count must be 0 or greater.' }, { status: 400 })
    }

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
      organizer,
      ...(organizerId ? { organizer_id: organizerId } : {}),
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
